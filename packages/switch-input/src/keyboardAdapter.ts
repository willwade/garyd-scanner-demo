import type { SwitchInputPort, Unsubscribe } from './port';

export type KeyboardBindings = Readonly<Record<string, string>>;
/** Keys whose press should also call `preventDefault()` on the event. */
export type PreventDefaultKeys = ReadonlySet<string>;

export interface KeyboardAdapterOptions {
  /**
   * Pass `true` to call `event.preventDefault()` on bound keys. Default:
   * `false` — let the app decide, except for Space/Enter which are
   * prevented by default because they trigger scrolling/clicks.
   */
  preventDefaultOnBound?: boolean;
  /** Set of switchIds whose keydown should always preventDefault. */
  alwaysPreventFor?: PreventDefaultKeys;
  /** Event phase to listen on. Default: 'bubble'. */
  capture?: boolean;
}

const DEFAULT_PREVENT = new Set<string>(['select']);

function eventToKey(event: KeyboardEvent): string {
  // Prefer `event.code` (physical key, e.g. "Space", "Enter", "Numpad1"),
  // fall back to `event.key` for older browsers and synthetic events.
  return event.code || event.key;
}

/**
 * Turn DOM `keydown` / `keyup` events into `press` / `release` calls on a
 * {@link SwitchInputPort}.
 *
 * ```ts
 * const keyboard = new KeyboardAdapter(window, port, {
 *   Space: 'select',
 *   Enter: 'select',
 *   Numpad1: 'switch-1',
 * });
 * // later:
 * keyboard.detach();
 * ```
 *
 * Auto-repeat keydowns (the OS synthesizes them while a key is held) are
 * ignored so the engine sees exactly one press and one release per physical
 * activation.
 */
export class KeyboardAdapter {
  private readonly target: EventTarget;
  private readonly port: SwitchInputPort;
  private readonly bindings: KeyboardBindings;
  private readonly sourceId = 'keyboard';
  private readonly capture: boolean;
  private readonly alwaysPrevent: PreventDefaultKeys;
  private readonly preventOnBound: boolean;
  /** Keys currently physically down, to dedupe OS auto-repeat. */
  private readonly down = new Set<string>();

  constructor(
    target: EventTarget,
    port: SwitchInputPort,
    bindings: KeyboardBindings,
    options: KeyboardAdapterOptions = {},
  ) {
    this.target = target;
    this.port = port;
    this.bindings = bindings;
    this.capture = options.capture ?? false;
    this.alwaysPrevent = options.alwaysPreventFor ?? DEFAULT_PREVENT;
    this.preventOnBound = options.preventDefaultOnBound ?? false;

    this.target.addEventListener('keydown', this.onKeyDown as EventListener, { capture: this.capture });
    this.target.addEventListener('keyup', this.onKeyUp as EventListener, { capture: this.capture });
    // Blur the window → treat as a disconnect so stuck keys are released.
    if (typeof window !== 'undefined' && this.target === window) {
      window.addEventListener('blur', this.onWindowBlur);
    }
  }

  /** Stop listening and release any currently-down keys. */
  detach(): void {
    this.target.removeEventListener('keydown', this.onKeyDown as EventListener, { capture: this.capture });
    this.target.removeEventListener('keyup', this.onKeyUp as EventListener, { capture: this.capture });
    if (typeof window !== 'undefined' && this.target === window) {
      window.removeEventListener('blur', this.onWindowBlur);
    }
    this.port.disconnect(this.sourceId);
  }

  /** Returns the binding → switchId map (read-only view). */
  getBindings(): KeyboardBindings {
    return this.bindings;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return; // OS auto-repeat — ignore.
    const key = eventToKey(event);
    const switchId = this.bindings[key];
    if (!switchId) return;
    if (this.down.has(key)) return;
    this.down.add(key);

    if (this.preventOnBound || this.alwaysPrevent.has(switchId)) {
      event.preventDefault();
    }
    this.port.press(switchId, this.sourceId);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const key = eventToKey(event);
    if (!this.down.has(key)) return;
    this.down.delete(key);
    const switchId = this.bindings[key];
    if (!switchId) return;
    this.port.release(switchId, this.sourceId);
  };

  private readonly onWindowBlur = (): void => {
    // The OS may eat the keyup when the window loses focus. Force-release
    // everything we think is down.
    for (const key of Array.from(this.down)) {
      const switchId = this.bindings[key];
      if (switchId) this.port.release(switchId, this.sourceId);
    }
    this.down.clear();
  };
}

/** Functional convenience: attach + return an unsubscribe. */
export function attachKeyboard(
  target: EventTarget,
  port: SwitchInputPort,
  bindings: KeyboardBindings,
  options?: KeyboardAdapterOptions,
): Unsubscribe {
  const adapter = new KeyboardAdapter(target, port, bindings, options);
  return () => adapter.detach();
}
