import type { SwitchInputPort, Unsubscribe } from './port';

/** Default USAHP v0 broker URL (loopback WebSocket). */
export const USAHP_DEFAULT_URL = 'ws://127.0.0.1:7312';

export type UsahpStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * The slice of `WebSocket` the adapter depends on. Narrowing the type lets
 * tests inject a fake without depending on a real network stack. The browser
 * `WebSocket` satisfies this structurally.
 */
export interface UsahpSocket {
  addEventListener(type: string, listener: (ev: { data?: unknown }) => void): void;
  close(code?: number, reason?: string): void;
}

export interface UsahpAdapterOptions {
  /** Broker URL. Default {@link USAHP_DEFAULT_URL}. */
  url?: string;
  /** Auto-connect on construct. Default `true`. */
  enabled?: boolean;
  /** Reconnect after the socket drops. Default `true`. */
  reconnect?: boolean;
  /** [initial, max] reconnect backoff in ms. Default `[250, 2000]`. */
  backoffMs?: [number, number];
  /**
   * Factory used to open the socket. Defaults to the global `WebSocket`.
   * Inject a fake for deterministic tests.
   */
  createSocket?: (url: string) => UsahpSocket;
  /** Status transitions (for UI indicators). */
  onStatus?: (status: UsahpStatus) => void;
  /** Fired with the broker's configured `switch_id`s from the `hello` frame. */
  onSwitches?: (switchIds: string[]) => void;
}

const defaultCreateSocket = (url: string): UsahpSocket =>
  new WebSocket(url) as unknown as UsahpSocket;

/**
 * Drives a {@link SwitchInputPort} (e.g. a `GestureEngine`) from a USAHP v0
 * event broker. Connects to the daemon's loopback WebSocket, consumes the
 * `hello` snapshot + ordered `switch_event` frames, and turns them into
 * `press` / `release` calls on the port under the `usahp` source id.
 *
 * v0 is a passive broadcast protocol — the adapter never sends frames. On
 * socket loss it force-releases every switch it owns (via `disconnect`) and
 * reconnects with capped exponential backoff.
 *
 * ```ts
 * const adapter = new UsahpAdapter(engine, {
 *   onStatus: (s) => updateIndicator(s),
 *   onSwitches: (ids) => console.log('broker switches:', ids),
 * });
 * // later:
 * adapter.detach();
 * ```
 */
export class UsahpAdapter {
  private readonly port: SwitchInputPort;
  private readonly url: string;
  private readonly sourceId = 'usahp';
  private readonly doReconnect: boolean;
  private readonly backoff: [number, number];
  private readonly createSocketImpl: (url: string) => UsahpSocket;
  private readonly onStatusCb?: (status: UsahpStatus) => void;
  private readonly onSwitchesCb?: (switchIds: string[]) => void;

  private socket: UsahpSocket | null = null;
  private stopped = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private backoffNext: number;

  constructor(port: SwitchInputPort, options: UsahpAdapterOptions = {}) {
    this.port = port;
    this.url = options.url ?? USAHP_DEFAULT_URL;
    this.doReconnect = options.reconnect ?? true;
    this.backoff = options.backoffMs ?? [250, 2000];
    this.createSocketImpl = options.createSocket ?? defaultCreateSocket;
    this.onStatusCb = options.onStatus;
    this.onSwitchesCb = options.onSwitches;
    this.backoffNext = this.backoff[0];

    if (options.enabled ?? true) {
      this.stopped = false;
      this.connect();
    }
  }

  /** (Re)start connecting after {@link detach}, or when `enabled` was false. */
  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.backoffNext = this.backoff[0];
    this.connect();
  }

  /** Full teardown: close the socket, cancel pending reconnect, release source. */
  detach(): void {
    this.stopped = true;
    this.clearReconnect();
    if (this.socket) {
      try {
        this.socket.close(1000, 'detach');
      } catch {
        // ignore — the socket may already be closing
      }
      this.socket = null;
    }
    this.port.disconnect(this.sourceId);
    this.setStatus('idle');
  }

  private connect(): void {
    if (this.stopped) return;
    this.setStatus('connecting');
    let socket: UsahpSocket;
    try {
      socket = this.createSocketImpl(this.url);
    } catch {
      this.setStatus('error');
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;

    socket.addEventListener('open', () => {
      if (this.stopped) return;
      // A clean connect resets the backoff window.
      this.backoffNext = this.backoff[0];
      this.setStatus('connected');
    });

    socket.addEventListener('message', (ev) => {
      if (this.stopped) return;
      this.onMessage(ev?.data);
    });

    socket.addEventListener('close', () => {
      if (this.stopped) return;
      this.socket = null;
      // The link is gone: force-release anything we own so the engine isn't
      // left with a stuck press, then try again.
      this.port.disconnect(this.sourceId);
      this.setStatus('disconnected');
      this.scheduleReconnect();
    });

    socket.addEventListener('error', () => {
      if (this.stopped) return;
      // A 'close' always follows 'error' on a WebSocket; reconnect there.
      this.setStatus('error');
    });
  }

  private scheduleReconnect(): void {
    if (!this.doReconnect || this.stopped) return;
    this.clearReconnect();
    const delay = this.backoffNext;
    this.backoffNext = Math.min(this.backoffNext * 2, this.backoff[1]);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private onMessage(data: unknown): void {
    if (typeof data !== 'string') return; // v0 ships text frames only
    let msg: unknown;
    try {
      msg = JSON.parse(data);
    } catch {
      return; // malformed frame — ignore
    }
    if (!msg || typeof msg !== 'object') return;
    const type = (msg as { type?: unknown }).type;

    if (type === 'hello') {
      const switches = (msg as { switches?: unknown }).switches;
      if (!Array.isArray(switches)) return;
      const ids: string[] = [];
      for (const s of switches) {
        if (!s || typeof s !== 'object') continue;
        const id = (s as { switch_id?: unknown }).switch_id;
        if (typeof id !== 'string') continue;
        ids.push(id);
        // Reflect current held state so the engine matches the broker.
        if ((s as { state?: unknown }).state === 'pressed') {
          this.port.press(id, this.sourceId);
        }
      }
      this.onSwitchesCb?.(ids);
      return;
    }

    if (type === 'switch_event') {
      const id = (msg as { switch_id?: unknown }).switch_id;
      const action = (msg as { action?: unknown }).action;
      if (typeof id !== 'string') return;
      if (action === 'pressed') this.port.press(id, this.sourceId);
      else if (action === 'released') this.port.release(id, this.sourceId);
      return;
    }

    // Unknown frame — ignore (stays forward-compatible with future types).
  }

  private setStatus(status: UsahpStatus): void {
    this.onStatusCb?.(status);
  }
}

/** Functional convenience: construct + return an unsubscribe that detaches. */
export function attachUsahp(
  port: SwitchInputPort,
  options?: UsahpAdapterOptions,
): Unsubscribe {
  const adapter = new UsahpAdapter(port, options);
  return () => adapter.detach();
}
