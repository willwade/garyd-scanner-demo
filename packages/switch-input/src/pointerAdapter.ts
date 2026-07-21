import type { SwitchInputPort, Unsubscribe } from './port';

export interface PointerAdapterOptions {
  /** Treat pointer cancel as a release. Default: true. */
  releaseOnCancel?: boolean;
  /** Treat pointercancel/leave on the document as a release. Default: true. */
  releaseOnLeave?: boolean;
}

/**
 * Turn DOM `pointerdown` / `pointerup` events on an element into `press` /
 * `release` calls on a {@link SwitchInputPort}. Works for mouse, touch, and
 * pen — pointer events unify them. The element should set `touch-action:
 * none` so the browser doesn't synthesize a fake mousedown after a
 * touchstart.
 *
 * ```ts
 * const surface = document.querySelector('#my-switch');
 * const pointer = new PointerAdapter(surface, port, 'primary');
 * // later:
 * pointer.detach();
 * ```
 *
 * A single surface owns one switch. To distinguish tap from hold, let the
 * {@link GestureEngine} decide based on the press/release timing.
 */
export class PointerAdapter {
  private readonly target: EventTarget;
  private readonly port: SwitchInputPort;
  private readonly switchId: string;
  private readonly sourceId: string;
  private readonly releaseOnCancel: boolean;
  private readonly releaseOnLeave: boolean;
  private activePointerId: number | null = null;

  constructor(
    target: EventTarget,
    port: SwitchInputPort,
    switchId: string,
    options: PointerAdapterOptions = {},
  ) {
    this.target = target;
    this.port = port;
    this.switchId = switchId;
    this.sourceId = `pointer:${switchId}`;
    this.releaseOnCancel = options.releaseOnCancel ?? true;
    this.releaseOnLeave = options.releaseOnLeave ?? true;

    this.target.addEventListener('pointerdown', this.onPointerDown as EventListener);
    this.target.addEventListener('pointerup', this.onPointerUp as EventListener);
    if (this.releaseOnCancel) {
      this.target.addEventListener('pointercancel', this.onPointerCancel as EventListener);
    }
    if (this.releaseOnLeave) {
      this.target.addEventListener('pointerleave', this.onPointerLeave as EventListener);
    }
  }

  detach(): void {
    this.target.removeEventListener('pointerdown', this.onPointerDown as EventListener);
    this.target.removeEventListener('pointerup', this.onPointerUp as EventListener);
    this.target.removeEventListener('pointercancel', this.onPointerCancel as EventListener);
    this.target.removeEventListener('pointerleave', this.onPointerLeave as EventListener);
    this.port.disconnect(this.sourceId);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    // Coalesce multiple simultaneous pointers onto the first one.
    if (this.activePointerId !== null) return;
    this.activePointerId = event.pointerId;
    this.port.press(this.switchId, this.sourceId);
  };

  private readonly endActive = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId) return;
    this.activePointerId = null;
    this.port.release(this.switchId, this.sourceId);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.endActive(event);
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    this.endActive(event);
  };

  private readonly onPointerLeave = (event: PointerEvent): void => {
    // Only end if the pointer actually left while down.
    if (this.activePointerId === event.pointerId && event.buttons === 0) {
      this.endActive(event);
    }
  };
}

/** Functional convenience: attach + return an unsubscribe. */
export function attachPointer(
  target: EventTarget,
  port: SwitchInputPort,
  switchId: string,
  options?: PointerAdapterOptions,
): Unsubscribe {
  const adapter = new PointerAdapter(target, port, switchId, options);
  return () => adapter.detach();
}
