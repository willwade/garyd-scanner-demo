import type { SwitchAction } from 'scan-engine';
import type { Unsubscribe } from './port';
import type { GestureEngine, GestureEvent, GestureEventType } from './gestureEngine';

/**
 * Per-switch binding. A switch can map to a single action that fires on any
 * tap, or to different actions for tap and hold.
 *
 * ```ts
 * const bindings: SwitchBindings = {
 *   'primary': { tap: 'select', hold: 'cancel' },
 *   'secondary': 'step',
 * };
 * ```
 */
export type SwitchBindings = Readonly<Record<string, SwitchAction | { tap?: SwitchAction; hold?: SwitchAction }>>;

export interface ScannerLike {
  handleAction(action: SwitchAction): void;
}

/**
 * Connect a {@link GestureEngine} to a scanner (or anything with a
 * `handleAction(SwitchAction)` method). For each switch in `bindings`:
 *
 * - On `tap`, fire `bindings[switchId].tap` (or `bindings[switchId]` if it
 *   is a plain action).
 * - On `hold`, fire `bindings[switchId].hold` (if defined).
 * - On `repeat`, fire the same action as `hold` (if any) — useful for
 *   "press-and-hold to step repeatedly".
 *
 * Returns an unsubscribe that removes every listener the bridge added.
 */
export function connectToScanner(
  engine: GestureEngine,
  scanner: ScannerLike,
  bindings: SwitchBindings,
): Unsubscribe {
  const unsubs: Unsubscribe[] = [];

  const lookup = (switchId: string, gesture: 'tap' | 'hold'): SwitchAction | undefined => {
    const binding = bindings[switchId];
    if (!binding) return undefined;
    if (typeof binding === 'string') {
      return gesture === 'tap' ? binding : undefined;
    }
    return gesture === 'tap' ? binding.tap : binding.hold;
  };

  const handle = (gesture: 'tap' | 'hold') => (event: GestureEvent) => {
    const action = lookup(event.switchId, gesture);
    if (action) scanner.handleAction(action);
  };

  unsubs.push(engine.on('tap' as GestureEventType, handle('tap')));
  unsubs.push(engine.on('hold' as GestureEventType, handle('hold')));
  unsubs.push(
    engine.on('repeat' as GestureEventType, (event) => {
      // Repeats are continuations of a hold.
      const action = lookup(event.switchId, 'hold');
      if (action) scanner.handleAction(action);
    }),
  );

  return () => {
    for (const unsub of unsubs) unsub();
  };
}
