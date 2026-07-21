import { describe, it, expect } from 'vitest';
import { GestureEngine, createManualGestureEngine } from './gestureEngine';
import { connectToScanner } from './scannerBridge';
import type { SwitchAction } from 'scan-engine';

function fakeScanner() {
  const actions: SwitchAction[] = [];
  return {
    actions,
    handleAction(a: SwitchAction) {
      actions.push(a);
    },
  };
}

describe('connectToScanner', () => {
  it('plain-string bindings fire on tap', () => {
    const engine = new GestureEngine({ tapWindowMs: 100, holdThresholdMs: 1000 });
    const scanner = fakeScanner();
    const bridge = connectToScanner(engine, scanner, {
      primary: 'select',
      secondary: 'step',
    });
    engine.press('primary');
    engine.release('primary'); // tap (no clock advanced → duration 0 ≤ tapWindow)
    engine.press('secondary');
    engine.release('secondary');
    expect(scanner.actions).toEqual(['select', 'step']);
    bridge();
  });

  it('per-switch tap and hold map to different actions', () => {
    const { engine, clock } = createManualGestureEngine({ tapWindowMs: 50, holdThresholdMs: 100 });
    const scanner = fakeScanner();
    const bridge = connectToScanner(engine, scanner, {
      primary: { tap: 'select', hold: 'cancel' },
    });

    // Tap → select
    engine.press('primary');
    clock.advanceBy(10);
    engine.release('primary');
    expect(scanner.actions).toEqual(['select']);

    // Hold → cancel
    engine.press('primary');
    clock.advanceBy(100);
    expect(scanner.actions).toEqual(['select', 'cancel']);

    bridge();
  });

  it('repeats re-fire the hold action', () => {
    const { engine, clock } = createManualGestureEngine({
      tapWindowMs: 50,
      holdThresholdMs: 100,
      repeatIntervalMs: 80,
    });
    const scanner = fakeScanner();
    connectToScanner(engine, scanner, {
      primary: { hold: 'step' },
    });

    engine.press('primary');
    clock.advanceBy(100); // hold → step
    clock.advanceBy(80);  // repeat → step
    clock.advanceBy(80);  // repeat → step
    expect(scanner.actions).toEqual(['step', 'step', 'step']);
  });

  it('unsubscribe stops dispatch', () => {
    const engine = new GestureEngine({ tapWindowMs: 100, holdThresholdMs: 1000 });
    const scanner = fakeScanner();
    const bridge = connectToScanner(engine, scanner, { primary: 'select' });
    bridge();

    engine.press('primary');
    engine.release('primary');
    expect(scanner.actions).toEqual([]);
  });

  it('ignores switches with no binding', () => {
    const engine = new GestureEngine({ tapWindowMs: 100, holdThresholdMs: 1000 });
    const scanner = fakeScanner();
    connectToScanner(engine, scanner, { primary: 'select' });

    engine.press('unbound');
    engine.release('unbound');
    expect(scanner.actions).toEqual([]);
  });
});
