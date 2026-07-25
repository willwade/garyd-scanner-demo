import { describe, it, expect, vi } from 'vitest';
import { KeyboardAdapter } from './keyboardAdapter';
import { GestureEngine } from './gestureEngine';

function dispatch(target: EventTarget, type: string, init: Record<string, unknown> = {}) {
  const event = new KeyboardEvent(type, {
    code: 'Space',
    key: ' ',
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

describe('KeyboardAdapter', () => {
  it('turns keydown/keyup into press/release', () => {
    const target = new EventTarget();
    const engine = new GestureEngine({ tapWindowMs: 100, holdThresholdMs: 1000 });
    const adapter = new KeyboardAdapter(target, engine, { Space: 'primary' });

    const presses: string[] = [];
    engine.on('press', (e) => presses.push(e.switchId));

    dispatch(target, 'keydown');
    expect(presses).toEqual(['primary']);

    const releases: string[] = [];
    engine.on('release', (e) => releases.push(e.switchId));
    dispatch(target, 'keyup');
    expect(releases).toEqual(['primary']);

    adapter.detach();
  });

  it('ignores OS auto-repeat', () => {
    const target = new EventTarget();
    const engine = new GestureEngine();
    const adapter = new KeyboardAdapter(target, engine, { Space: 'primary' });

    const presses: string[] = [];
    engine.on('press', (e) => presses.push(e.switchId));

    dispatch(target, 'keydown', { repeat: false });
    dispatch(target, 'keydown', { repeat: true });
    dispatch(target, 'keydown', { repeat: true });
    expect(presses).toEqual(['primary']);
    adapter.detach();
  });

  it('only fires for bound keys', () => {
    const target = new EventTarget();
    const engine = new GestureEngine();
    const adapter = new KeyboardAdapter(target, engine, { Space: 'primary' });

    const presses: string[] = [];
    engine.on('press', (e) => presses.push(e.switchId));

    dispatch(target, 'keydown', { code: 'KeyA' });
    expect(presses).toEqual([]);
    adapter.detach();
  });

  it('detach() force-releases any keys still down', () => {
    const target = new EventTarget();
    const engine = new GestureEngine();
    const adapter = new KeyboardAdapter(target, engine, { Space: 'primary' });

    const releases: string[] = [];
    engine.on('release', (e) => releases.push(e.switchId));

    dispatch(target, 'keydown');
    expect(releases).toEqual([]);
    adapter.detach();
    expect(releases).toEqual(['primary']);
  });

  it('preventDefault is called for select by default', () => {
    const target = new EventTarget();
    const engine = new GestureEngine();
    const adapter = new KeyboardAdapter(target, engine, { Space: 'select' });

    const event = dispatch(target, 'keydown');
    expect(event.defaultPrevented).toBe(true);
    adapter.detach();
  });

  it('preventDefault is not called for unrecognised switches', () => {
    const target = new EventTarget();
    const engine = new GestureEngine();
    const adapter = new KeyboardAdapter(target, engine, { KeyR: 'reset' });

    const event = dispatch(target, 'keydown', { code: 'KeyR', key: 'r' });
    expect(event.defaultPrevented).toBe(false);
    adapter.detach();
  });
});
