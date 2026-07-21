import { describe, it, expect } from 'vitest';
import { PointerAdapter } from './pointerAdapter';
import { GestureEngine } from './gestureEngine';

function pointer(target: EventTarget, type: string, init: Record<string, unknown> = {}) {
  const event = new PointerEvent(type, {
    pointerId: 1,
    pointerType: 'mouse',
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

describe('PointerAdapter', () => {
  it('pointerdown/up maps to press/release', () => {
    const target = new EventTarget();
    const engine = new GestureEngine({ tapWindowMs: 100, holdThresholdMs: 1000 });
    const adapter = new PointerAdapter(target, engine, 'surface');

    const events: string[] = [];
    engine.on('press', () => events.push('press'));
    engine.on('release', () => events.push('release'));

    pointer(target, 'pointerdown');
    pointer(target, 'pointerup');
    expect(events).toEqual(['press', 'release']);
    adapter.detach();
  });

  it('coalesces simultaneous pointers to one press', () => {
    const target = new EventTarget();
    const engine = new GestureEngine();
    const adapter = new PointerAdapter(target, engine, 'surface');

    const presses: number[] = [];
    engine.on('press', () => presses.push(1));

    pointer(target, 'pointerdown', { pointerId: 1 });
    pointer(target, 'pointerdown', { pointerId: 2 });
    expect(presses).toHaveLength(1);
    adapter.detach();
  });

  it('pointercancel ends the active press when releaseOnCancel is true', () => {
    const target = new EventTarget();
    const engine = new GestureEngine();
    const adapter = new PointerAdapter(target, engine, 'surface');

    const releases: number[] = [];
    engine.on('release', () => releases.push(1));

    pointer(target, 'pointerdown');
    pointer(target, 'pointercancel');
    expect(releases).toHaveLength(1);
    adapter.detach();
  });

  it('detach() force-releases the active press', () => {
    const target = new EventTarget();
    const engine = new GestureEngine();
    const adapter = new PointerAdapter(target, engine, 'surface');

    const releases: number[] = [];
    engine.on('release', () => releases.push(1));

    pointer(target, 'pointerdown');
    expect(releases).toHaveLength(0);
    adapter.detach();
    expect(releases).toHaveLength(1);
  });

  it('pointerleave while not pressing does nothing', () => {
    const target = new EventTarget();
    const engine = new GestureEngine();
    const adapter = new PointerAdapter(target, engine, 'surface');

    const releases: number[] = [];
    engine.on('release', () => releases.push(1));

    pointer(target, 'pointerleave');
    expect(releases).toHaveLength(0);
    adapter.detach();
  });
});
