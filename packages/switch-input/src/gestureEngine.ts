import type { Scheduler } from 'scan-engine/scheduler';
import { manualScheduler, systemScheduler } from 'scan-engine/scheduler';
import type { SwitchInputPort, Unsubscribe } from './port';

/**
 * Every gesture the engine can emit. `at` is the scheduler's monotonic
 * clock so timestamps are deterministic in tests.
 */
export type GestureEvent =
  | { type: 'press'; switchId: string; at: number }
  | { type: 'release'; switchId: string; at: number; durationMs: number }
  | { type: 'tap'; switchId: string; at: number }
  | { type: 'hold'; switchId: string; at: number; afterMs: number }
  | { type: 'hold-release'; switchId: string; at: number; totalMs: number }
  | { type: 'repeat'; switchId: string; at: number; count: number }
  | { type: 'stuck'; switchId: string; at: number }
  | { type: 'quarantine'; switchId: string; at: number; sourceId: string }
  | { type: 'recover'; switchId: string; at: number };

export type GestureEventType = GestureEvent['type'];
export type GestureListener = (event: GestureEvent) => void;

export interface GestureEngineOptions {
  /**
   * Max duration between press and release that still counts as a tap.
   * Default: 250 ms.
   */
  tapWindowMs?: number;
  /**
   * Min duration a switch must be held before a `hold` event fires.
   * Default: 400 ms. Must be greater than `tapWindowMs` (otherwise taps
   * never fire — the engine will throw on construction).
   */
  holdThresholdMs?: number;
  /**
   * Interval at which `repeat` events fire while a switch is held past its
   * hold threshold. 0 disables repeats. Default: 0.
   */
  repeatIntervalMs?: number;
  /**
   * Press/release events shorter than this are ignored as tremor. Default:
   * 0 ms (no filter).
   */
  tremorFilterMs?: number;
  /**
   * Minimum time a switch must be **held** before its press is "accepted".
   * Presses released before this are discarded entirely (no `press`, no
   * `tap`) — an accidental-bump filter that, unlike `tremorFilterMs`, also
   * gates leading-edge (`press`) activation: the `press` event is delayed
   * until the acceptance threshold is reached. Default: 0 (disabled).
   *
   * Must be less than `holdThresholdMs`. Hold/tap durations are still
   * measured from the physical press, so the hold timer fires at the usual
   * `holdThresholdMs` regardless of acceptance.
   */
  acceptanceMs?: number;
  /**
   * After a release, ignore further presses of the same switch for this
   * long. Default: 0 ms (no suppression).
   */
  repeatSuppressMs?: number;
  /**
   * If a switch stays pressed for longer than this, assume the release was
   * lost and force-release it (fires `stuck`). 0 disables. Default: 60_000.
   */
  stuckTimeoutMs?: number;
  /**
   * Scheduler for deterministic tests. Defaults to real time.
   */
  scheduler?: Scheduler;
}

interface ActivePress {
  switchId: string;
  sourceId: string;
  pressedAt: number;
  confirmed: boolean;
  acceptanceCancel: () => void;
  holdTimer: () => void;
  holdCancel: () => void;
  repeatCount: number;
  repeated: boolean;
  stuckCancel: () => void;
  quarantined: boolean;
}

const DEFAULTS = {
  tapWindowMs: 250,
  holdThresholdMs: 400,
  repeatIntervalMs: 0,
  tremorFilterMs: 0,
  acceptanceMs: 0,
  repeatSuppressMs: 0,
  stuckTimeoutMs: 60_000,
};

/**
 * Turn raw `press` / `release` calls into semantic gestures.
 *
 * The engine is a {@link SwitchInputPort} — adapters call `press`/`release`
 * on it directly. Consumers subscribe with {@link GestureEngine.on}.
 *
 * Behavior per switch:
 *
 * - **Tap** — press + release within `tapWindowMs`.
 * - **Hold** — press, hold past `holdThresholdMs`. Fires `hold` once; if
 *   `repeatIntervalMs > 0`, fires `repeat` every `repeatIntervalMs` after
 *   that. When the switch finally releases, fires `hold-release`.
 * - **Tremor filter** — press/release shorter than `tremorFilterMs` is
 *   ignored entirely.
 * - **Repeat suppression** — after a release, presses of the same switch
 *   within `repeatSuppressMs` are ignored.
 * - **Stuck-switch quarantine** — a press older than `stuckTimeoutMs` is
 *   force-released (fires `stuck`). If `disconnect(sourceId)` is called,
 *   every live press from that source is force-released and the source is
 *   quarantined until the *real* release arrives (so a stale hardware state
 *   cannot keep firing presses).
 * - **Suspend** — every live press is released and all timers cancelled.
 *   Use this for window blur / tab hidden / OS-level switch handoff.
 */
export class GestureEngine implements SwitchInputPort, Disposable {
  private readonly scheduler: Scheduler;
  private readonly tapWindowMs: number;
  private readonly holdThresholdMs: number;
  private readonly repeatIntervalMs: number;
  private readonly tremorFilterMs: number;
  private readonly acceptanceMs: number;
  private readonly repeatSuppressMs: number;
  private readonly stuckTimeoutMs: number;

  private readonly active = new Map<string, ActivePress>();
  /** SwitchId → epoch (ms) before which presses are suppressed. */
  private readonly suppressedUntil = new Map<string, number>();
  /** Quarantined (switchId, sourceId) pairs awaiting real release. */
  private readonly quarantined = new Set<string>();
  private readonly listeners = new Map<GestureEventType, Set<GestureListener>>();

  constructor(options: GestureEngineOptions = {}) {
    const o = { ...DEFAULTS, ...options };
    if (o.holdThresholdMs <= o.tapWindowMs) {
      throw new Error(
        `GestureEngine: holdThresholdMs (${o.holdThresholdMs}) must be greater than tapWindowMs (${o.tapWindowMs})`,
      );
    }
    if (o.acceptanceMs > 0 && o.acceptanceMs >= o.holdThresholdMs) {
      throw new Error(
        `GestureEngine: acceptanceMs (${o.acceptanceMs}) must be less than holdThresholdMs (${o.holdThresholdMs})`,
      );
    }
    this.scheduler = o.scheduler ?? systemScheduler();
    this.tapWindowMs = o.tapWindowMs;
    this.holdThresholdMs = o.holdThresholdMs;
    this.repeatIntervalMs = o.repeatIntervalMs;
    this.tremorFilterMs = o.tremorFilterMs;
    this.acceptanceMs = o.acceptanceMs;
    this.repeatSuppressMs = o.repeatSuppressMs;
    this.stuckTimeoutMs = o.stuckTimeoutMs;
  }

  // ------------------------------------------------------------------
  // SwitchInputPort
  // ------------------------------------------------------------------

  press(switchId: string, sourceId: string = 'default'): void {
    if (this.quarantined.has(this.qKey(switchId, sourceId))) return;

    // Respect post-release suppression.
    const suppressedUntil = this.suppressedUntil.get(switchId);
    if (suppressedUntil !== undefined && this.scheduler.now() < suppressedUntil) {
      return;
    }
    this.suppressedUntil.delete(switchId);

    // Ignore a second press without a release (some keyboards auto-repeat;
    // some BLE devices flap). The first press wins.
    if (this.active.has(switchId)) return;

    const pressedAt = this.scheduler.now();

    // Stuck timer: if still pressed after stuckTimeoutMs, force-release.
    // Runs from the physical press (acceptance does not delay it).
    let stuckCancel: () => void = () => {};
    if (this.stuckTimeoutMs > 0) {
      stuckCancel = this.scheduler.schedule(() => {
        const current = this.active.get(switchId);
        if (!current) return;
        this.emit({ type: 'stuck', switchId, at: this.scheduler.now() });
        this.releaseInternal(switchId, current.sourceId, /*force*/ true);
      }, this.stuckTimeoutMs);
    }

    this.active.set(switchId, {
      switchId,
      sourceId,
      pressedAt,
      confirmed: false,
      acceptanceCancel: () => {},
      holdTimer: () => {},
      holdCancel: () => {},
      repeatCount: 0,
      repeated: false,
      stuckCancel,
      quarantined: false,
    });

    // Acceptance: delay confirmation (and the press event) until the switch
    // has been held for acceptanceMs. A release before that discards the
    // press entirely (see releaseInternal).
    if (this.acceptanceMs > 0) {
      const current = this.active.get(switchId)!;
      current.acceptanceCancel = this.scheduler.schedule(
        () => this.confirmAcceptance(switchId),
        this.acceptanceMs,
      );
    } else {
      this.confirmAcceptance(switchId);
    }
  }

  /**
   * Mark a press accepted and emit the `press` event, then arm the hold
   * timer for the remaining time so `hold` still fires at
   * `pressedAt + holdThresholdMs`. Idempotent / safe to call after release.
   */
  private confirmAcceptance(switchId: string): void {
    const current = this.active.get(switchId);
    if (!current || current.confirmed) return;
    current.confirmed = true;

    const startHold = () => {
      const c = this.active.get(switchId);
      if (!c) return;
      this.emit({ type: 'hold', switchId, at: this.scheduler.now(), afterMs: this.holdThresholdMs });
      if (this.repeatIntervalMs > 0) {
        this.scheduleRepeat(c);
      }
    };
    // Remaining time so hold fires at pressedAt + holdThresholdMs regardless
    // of how long acceptance took.
    const remaining = this.holdThresholdMs - this.acceptanceMs;
    current.holdTimer = startHold;
    current.holdCancel = this.scheduler.schedule(startHold, remaining);

    this.emit({ type: 'press', switchId, at: current.pressedAt });
  }

  release(switchId: string, sourceId: string = 'default'): void {
    // If this release is for a quarantined (switchId, sourceId), clear the
    // quarantine — the real release finally arrived.
    const qKey = this.qKey(switchId, sourceId);
    if (this.quarantined.has(qKey)) {
      this.quarantined.delete(qKey);
      this.emit({ type: 'recover', switchId, at: this.scheduler.now() });
    }

    const current = this.active.get(switchId);
    if (!current) return;
    // Ignore a release from a different source — the active press is owned
    // by whoever first pressed; another source's release is meaningless.
    if (current.sourceId !== sourceId) return;

    this.releaseInternal(switchId, sourceId, /*force*/ false);
  }

  disconnect(sourceId?: string): void {
    for (const [switchId, press] of Array.from(this.active.entries())) {
      if (sourceId === undefined || press.sourceId === sourceId) {
        // Force-release and quarantine so subsequent presses from this
        // source are ignored until the real release arrives.
        this.quarantined.add(this.qKey(switchId, press.sourceId));
        this.emit({
          type: 'quarantine',
          switchId,
          at: this.scheduler.now(),
          sourceId: press.sourceId,
        });
        this.releaseInternal(switchId, press.sourceId, /*force*/ true);
      }
    }
  }

  suspend(): void {
    for (const switchId of Array.from(this.active.keys())) {
      const press = this.active.get(switchId)!;
      this.releaseInternal(switchId, press.sourceId, /*force*/ true);
    }
  }

  // ------------------------------------------------------------------
  // Subscriptions
  // ------------------------------------------------------------------

  on(event: GestureEventType, listener: GestureListener): Unsubscribe {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => set!.delete(listener);
  }

  off(event: GestureEventType, listener: GestureListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  /** Live state for diagnostics. */
  get pressedSwitches(): readonly string[] {
    return Array.from(this.active.keys());
  }

  /** True if the (switchId, sourceId) pair is currently quarantined. */
  isQuarantined(switchId: string, sourceId: string = 'default'): boolean {
    return this.quarantined.has(this.qKey(switchId, sourceId));
  }

  [Symbol.dispose](): void {
    this.dispose();
  }

  dispose(): void {
    for (const press of this.active.values()) {
      press.acceptanceCancel();
      press.holdCancel();
      press.stuckCancel();
    }
    this.active.clear();
    this.suppressedUntil.clear();
    this.quarantined.clear();
    this.listeners.clear();
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private releaseInternal(switchId: string, _sourceId: string, force: boolean): void {
    const current = this.active.get(switchId);
    if (!current) return;
    current.acceptanceCancel();
    current.holdCancel();
    current.stuckCancel();
    this.active.delete(switchId);

    // Press released before it was accepted (held less than acceptanceMs):
    // discard entirely — no press was emitted, so no release/tap either.
    if (!current.confirmed) return;

    const now = this.scheduler.now();
    const durationMs = now - current.pressedAt;

    this.emit({ type: 'release', switchId, at: now, durationMs });

    // Force-releases (stuck / disconnect / suspend) only emit the raw
    // release; the gesture was interrupted by the environment, not by the
    // user, so synthesizing a tap or hold-release would be misleading.
    if (force) return;

    // Tremor filter: ignore very short taps entirely.
    if (this.tremorFilterMs > 0 && durationMs < this.tremorFilterMs) {
      return;
    }

    if (current.repeated || durationMs >= this.holdThresholdMs) {
      // Hold already fired; report the release as a hold-release.
      this.emit({ type: 'hold-release', switchId, at: now, totalMs: durationMs });
    } else if (durationMs <= this.tapWindowMs) {
      this.emit({ type: 'tap', switchId, at: now });
    } else {
      // Between tapWindow and holdThreshold — neither. Could be a "long
      // tap"; we report it as a hold-release since the user clearly held
      // past the tap window.
      this.emit({ type: 'hold-release', switchId, at: now, totalMs: durationMs });
    }

    if (this.repeatSuppressMs > 0) {
      this.suppressedUntil.set(switchId, now + this.repeatSuppressMs);
    }
  }

  private scheduleRepeat(current: ActivePress): void {
    const fire = () => {
      const stillActive = this.active.get(current.switchId);
      if (!stillActive || stillActive.pressedAt !== current.pressedAt) return;
      stillActive.repeatCount += 1;
      stillActive.repeated = true;
      this.emit({
        type: 'repeat',
        switchId: current.switchId,
        at: this.scheduler.now(),
        count: stillActive.repeatCount,
      });
      this.scheduleRepeat(stillActive);
    };
    const cancel = this.scheduler.schedule(fire, this.repeatIntervalMs);
    // Replace holdCancel so a later release cancels the repeat chain too.
    const previousCancel = current.holdCancel;
    current.holdCancel = () => {
      cancel();
      previousCancel();
    };
  }

  private emit(event: GestureEvent): void {
    const set = this.listeners.get(event.type);
    if (!set) return;
    for (const listener of set) {
      try {
        listener(event);
      } catch {
        // Listeners must never break the engine.
      }
    }
  }

  private qKey(switchId: string, sourceId: string): string {
    return `${sourceId}::${switchId}`;
  }
}

/**
 * Convenience constructor that wires the engine to a manual scheduler so a
 * test can drive time. Equivalent to `new GestureEngine({ scheduler: manualScheduler(), ...options })`.
 */
export function createManualGestureEngine(options: GestureEngineOptions = {}): {
  engine: GestureEngine;
  clock: ReturnType<typeof manualScheduler>;
} {
  const clock = manualScheduler();
  const engine = new GestureEngine({ ...options, scheduler: clock });
  return { engine, clock };
}
