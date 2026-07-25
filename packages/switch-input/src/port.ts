/**
 * Low-level switch input port. Anything that can press or release a logical
 * switch — a keyboard, a pointer surface, a BLE device, an external
 * assistive switch — reduces to this interface.
 *
 * The {@link GestureEngine} implements this port and turns raw press/release
 * calls into semantic gestures (tap, hold, repeat) with tremor filtering,
 * repeat suppression, and stuck-switch quarantine.
 *
 * `sourceId` lets the engine track which input source (e.g. `'keyboard'`,
 * `'pointer'`, `'ble-1'`) owns each press so a {@link SwitchInputPort.disconnect}
 * or {@link SwitchInputPort.suspend} can force-release only the right ones.
 */

export interface SwitchInputPort {
  /**
   * A switch with id `switchId` was pressed. Safe to call repeatedly; the
   * engine deduplicates per (switchId, sourceId).
   */
  press(switchId: string, sourceId?: string): void;
  /**
   * A switch with id `switchId` was released. Safe to call without a prior
   * press; the engine ignores no-ops.
   */
  release(switchId: string, sourceId?: string): void;
  /**
   * The given source has gone away (e.g. a BLE disconnect). Every press
   * owned by `sourceId` is force-released and quarantined until the real
   * release arrives. If `sourceId` is omitted, every live press is released.
   */
  disconnect(sourceId?: string): void;
  /**
   * The whole environment is suspended (e.g. the page was hidden, the OS
   * switch control took over). Every live press is force-released and any
   * pending gesture timers are cancelled.
   */
  suspend(): void;
}

export type Unsubscribe = () => void;
