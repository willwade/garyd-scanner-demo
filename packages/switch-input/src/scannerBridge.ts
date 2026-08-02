import type { SwitchAction } from 'scan-engine';
import type { Unsubscribe } from './port';
import type { GestureEngine, GestureEventType } from './gestureEngine';

/**
 * Per-switch binding.
 *
 * - A plain `SwitchAction` is shorthand for a **trailing-edge tap** (fires on
 *   release within the tap window).
 * - An object may set any of:
 *   - `press` — fires immediately on press (**leading edge**). Use this for
 *     "activate on press" behaviour.
 *   - `tap` — fires on a trailing-edge release.
 *   - `hold` — fires when the switch is held past the hold threshold.
 *
 * When both `tap` and `hold` are set (the long-hold-cancel pattern, e.g.
 * tap = select, hold = cancel), a release that happens *after* the tap window
 * but *before* the hold threshold still counts as `tap` — only a release that
 * arrives after `hold` already fired is suppressed. This matches AAC
 * long-hold-cancel: "release any time before the cancel threshold = select".
 *
 * ```ts
 * const bindings: SwitchBindings = {
 *   primary: { tap: 'select', hold: 'cancel' },
 *   secondary: { press: 'step' },
 * };
 * ```
 */
export type SwitchBinding =
  | SwitchAction
  | { press?: SwitchAction; tap?: SwitchAction; hold?: SwitchAction };

export type SwitchBindings = Readonly<Record<string, SwitchBinding>>;

export interface ScannerLike {
  handleAction(action: SwitchAction): void;
}

/**
 * Connect a {@link GestureEngine} to a scanner (or anything with a
 * `handleAction(SwitchAction)` method). See {@link SwitchBinding} for the
 * per-gesture mapping.
 *
 * Returns an unsubscribe that removes every listener the bridge added.
 */
export function connectToScanner(
  engine: GestureEngine,
  scanner: ScannerLike,
  bindings: SwitchBindings,
): Unsubscribe {
  const unsubs: Unsubscribe[] = [];
  // Per-switch flag: has a `hold` fired since the last press? Drives the
  // long-hold-cancel rule (see SwitchBinding docs).
  const holdFired = new Set<string>();

  const resolve = (
    switchId: string,
  ): { press?: SwitchAction; tap?: SwitchAction; hold?: SwitchAction } => {
    const binding = bindings[switchId];
    if (!binding) return {};
    if (typeof binding === 'string') return { tap: binding };
    return binding;
  };

  const fire = (action: SwitchAction | undefined) => {
    if (action) scanner.handleAction(action);
  };

  unsubs.push(
    engine.on('press' as GestureEventType, (event) => {
      holdFired.delete(event.switchId);
      fire(resolve(event.switchId).press);
    }),
  );

  unsubs.push(
    engine.on('tap' as GestureEventType, (event) => {
      fire(resolve(event.switchId).tap);
    }),
  );

  unsubs.push(
    engine.on('hold' as GestureEventType, (event) => {
      const b = resolve(event.switchId);
      if (b.hold) holdFired.add(event.switchId);
      fire(b.hold);
    }),
  );

  unsubs.push(
    engine.on('hold-release' as GestureEventType, (event) => {
      const b = resolve(event.switchId);
      // Long-hold-cancel pattern: a release before the hold fired still
      // counts as the tap action. If the hold already fired, the hold action
      // wins and we suppress the tap.
      if (b.tap && b.hold && !holdFired.has(event.switchId)) {
        fire(b.tap);
      }
      holdFired.delete(event.switchId);
    }),
  );

  unsubs.push(
    engine.on('repeat' as GestureEventType, (event) => {
      // Repeats are continuations of a hold.
      fire(resolve(event.switchId).hold);
    }),
  );

  return () => {
    for (const unsub of unsubs) unsub();
  };
}
