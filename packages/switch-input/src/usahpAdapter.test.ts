import { describe, it, expect, vi, afterEach } from 'vitest';
import { UsahpAdapter, type UsahpSocket, type UsahpStatus } from './usahpAdapter';
import type { SwitchInputPort } from './port';
import { GestureEngine } from './gestureEngine';

/** EventTarget-backed fake socket. The adapter talks to this; tests emit. */
class MockSocket implements UsahpSocket {
  private readonly target = new EventTarget();
  closed = false;
  closeCode: number | undefined;

  addEventListener(type: string, listener: (ev: { data?: unknown }) => void): void {
    this.target.addEventListener(type, listener as EventListener);
  }
  close(code?: number): void {
    this.closed = true;
    this.closeCode = code;
  }
  emit(type: 'open' | 'close' | 'error'): void;
  emit(type: 'message', data: unknown): void;
  emit(type: string, data?: unknown): void {
    if (type === 'message') {
      this.target.dispatchEvent(new MessageEvent('message', { data }));
    } else {
      this.target.dispatchEvent(new Event(type));
    }
  }
}

function mockFactory() {
  const sockets: MockSocket[] = [];
  const factory = (_url: string) => {
    const s = new MockSocket();
    sockets.push(s);
    return s;
  };
  return { factory, sockets, current: () => sockets[sockets.length - 1] };
}

function recordingPort() {
  type Call = { op: string; id?: string; source?: string };
  const calls: Call[] = [];
  const port: SwitchInputPort = {
    press: (id, source) => calls.push({ op: 'press', id, source }),
    release: (id, source) => calls.push({ op: 'release', id, source }),
    disconnect: (source) => calls.push({ op: 'disconnect', source }),
    suspend: () => calls.push({ op: 'suspend' }),
  };
  return { port, calls };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('UsahpAdapter', () => {
  it('auto-connects on construct and reports status', () => {
    const { port } = recordingPort();
    const statuses: UsahpStatus[] = [];
    const { factory, sockets } = mockFactory();
    const adapter = new UsahpAdapter(port, { createSocket: factory, onStatus: (s) => statuses.push(s) });
    expect(sockets.length).toBe(1);
    expect(statuses[0]).toBe('connecting');
    sockets[0].emit('open');
    expect(statuses).toContain('connected');
    adapter.detach();
  });

  it('hello reports switches and syncs currently-held state', () => {
    const { port, calls } = recordingPort();
    let switchList: string[] | null = null;
    const { factory, current } = mockFactory();
    const adapter = new UsahpAdapter(port, {
      createSocket: factory,
      onSwitches: (ids) => (switchList = ids),
    });
    current()!.emit('open');
    current()!.emit(
      'message',
      JSON.stringify({
        type: 'hello',
        protocol_version: '0.1',
        switches: [
          { switch_id: 'switch_1', state: 'pressed' },
          { switch_id: 'switch_2', state: 'released' },
        ],
      }),
    );
    expect(switchList).toEqual(['switch_1', 'switch_2']);
    // Held-at-connect switch is reflected as a press; released is not.
    expect(calls).toContainEqual({ op: 'press', id: 'switch_1', source: 'usahp' });
    expect(calls.some((c) => c.id === 'switch_2')).toBe(false);
    adapter.detach();
  });

  it('switch_event pressed/released drive the port', () => {
    const { port, calls } = recordingPort();
    const { factory, current } = mockFactory();
    const adapter = new UsahpAdapter(port, { createSocket: factory });
    current()!.emit('open');
    const send = (o: unknown) => current()!.emit('message', JSON.stringify(o));
    send({ type: 'hello', protocol_version: '0.1', switches: [{ switch_id: 'switch_1', state: 'released' }] });
    send({ type: 'switch_event', protocol_version: '0.1', sequence: 1, monotonic_us: 1, switch_id: 'switch_1', action: 'pressed' });
    send({ type: 'switch_event', protocol_version: '0.1', sequence: 2, monotonic_us: 2, switch_id: 'switch_1', action: 'released' });
    expect(calls.filter((c) => c.op === 'press')).toEqual([{ op: 'press', id: 'switch_1', source: 'usahp' }]);
    expect(calls.filter((c) => c.op === 'release')).toEqual([{ op: 'release', id: 'switch_1', source: 'usahp' }]);
    adapter.detach();
  });

  it('ignores non-text, malformed JSON, unknown types, and bad ids', () => {
    const { port, calls } = recordingPort();
    const { factory, current } = mockFactory();
    const adapter = new UsahpAdapter(port, { createSocket: factory });
    current()!.emit('open');
    current()!.emit('message', { not: 'a string' } as unknown as string); // non-text → ignored
    current()!.emit('message', '{not json');
    current()!.emit('message', JSON.stringify({ type: 'future_thing', foo: 1 }));
    current()!.emit('message', JSON.stringify({ type: 'switch_event', switch_id: 123, action: 'pressed' }));
    expect(calls.length).toBe(0);
    adapter.detach();
  });

  it('socket close force-releases held switches (disconnect source)', () => {
    const { port, calls } = recordingPort();
    const { factory, current } = mockFactory();
    const adapter = new UsahpAdapter(port, { createSocket: factory, reconnect: false });
    current()!.emit('open');
    const send = (o: unknown) => current()!.emit('message', JSON.stringify(o));
    send({ type: 'hello', protocol_version: '0.1', switches: [{ switch_id: 'switch_1', state: 'released' }] });
    send({ type: 'switch_event', protocol_version: '0.1', sequence: 1, monotonic_us: 1, switch_id: 'switch_1', action: 'pressed' });
    expect(calls.some((c) => c.op === 'release')).toBe(false);

    current()!.emit('close');
    expect(calls).toContainEqual({ op: 'disconnect', source: 'usahp' });
    adapter.detach();
  });

  it('reconnects with capped exponential backoff', () => {
    vi.useFakeTimers();
    const { port } = recordingPort();
    const { factory, sockets } = mockFactory();
    const adapter = new UsahpAdapter(port, { createSocket: factory, backoffMs: [100, 400] });

    sockets[0].emit('close'); // drop 1 → reconnect after 100ms
    vi.advanceTimersByTime(99);
    expect(sockets.length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(sockets.length).toBe(2);

    sockets[1].emit('close'); // drop 2 → 200ms
    vi.advanceTimersByTime(199);
    expect(sockets.length).toBe(2);
    vi.advanceTimersByTime(1);
    expect(sockets.length).toBe(3);

    sockets[2].emit('close'); // drop 3 → capped at 400ms
    vi.advanceTimersByTime(399);
    expect(sockets.length).toBe(3);
    vi.advanceTimersByTime(1);
    expect(sockets.length).toBe(4);
    adapter.detach();
  });

  it('a clean reconnect resets the backoff window', () => {
    vi.useFakeTimers();
    const { port } = recordingPort();
    const { factory, sockets } = mockFactory();
    const adapter = new UsahpAdapter(port, { createSocket: factory, backoffMs: [100, 400] });

    sockets[0].emit('close');
    vi.advanceTimersByTime(100); // reconnect → socket 2
    sockets[1].emit('open'); // clean connect → backoff resets to 100
    sockets[1].emit('close');
    vi.advanceTimersByTime(100); // would only be 100 if reset; 200 if not
    expect(sockets.length).toBe(3);
    adapter.detach();
  });

  it('enabled:false defers connection until start()', () => {
    const { port } = recordingPort();
    const { factory, sockets } = mockFactory();
    const adapter = new UsahpAdapter(port, { createSocket: factory, enabled: false });
    expect(sockets.length).toBe(0);
    adapter.start();
    expect(sockets.length).toBe(1);
    adapter.detach();
  });

  it('detach closes a live socket and prevents further reconnect', () => {
    vi.useFakeTimers();
    const { port } = recordingPort();
    const { factory, sockets, current } = mockFactory();
    const adapter = new UsahpAdapter(port, { createSocket: factory });
    const live = current()!;
    adapter.detach();
    expect(live.closed).toBe(true);
    expect(live.closeCode).toBe(1000);

    sockets[0].emit('close'); // simulate late server close
    vi.advanceTimersByTime(10_000); // no reconnect should occur
    expect(sockets.length).toBe(1);
  });

  it('drives a GestureEngine end-to-end: broker press+release → tap', () => {
    const engine = new GestureEngine({ tapWindowMs: 100, holdThresholdMs: 1000 });
    const taps: string[] = [];
    engine.on('tap', (e) => taps.push(e.switchId));
    const { factory, current } = mockFactory();
    const adapter = new UsahpAdapter(engine, { createSocket: factory });
    current()!.emit('open');
    const send = (o: unknown) => current()!.emit('message', JSON.stringify(o));
    send({ type: 'hello', protocol_version: '0.1', switches: [{ switch_id: 'switch_1', state: 'released' }] });
    send({ type: 'switch_event', protocol_version: '0.1', sequence: 1, monotonic_us: 1, switch_id: 'switch_1', action: 'pressed' });
    send({ type: 'switch_event', protocol_version: '0.1', sequence: 2, monotonic_us: 2, switch_id: 'switch_1', action: 'released' });
    expect(taps).toEqual(['switch_1']);
    adapter.detach();
  });
});
