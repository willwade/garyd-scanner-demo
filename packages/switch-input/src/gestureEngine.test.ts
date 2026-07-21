import { describe, it, expect } from 'vitest';
import {
  GestureEngine,
  createManualGestureEngine,
  type GestureEvent,
} from './gestureEngine';

function recorder(engine: GestureEngine, ...types: GestureEvent['type'][]) {
  const events: GestureEvent[] = [];
  const unsubs = types.map((t) => engine.on(t, (e) => events.push(e)));
  return {
    events,
    get types(): GestureEvent['type'][] {
      return events.map((e) => e.type);
    },
    unsubscribe: () => unsubs.forEach((u) => u()),
  };
}

describe('GestureEngine basics', () => {
  it('rejects tapWindow >= holdThreshold at construction', () => {
    expect(() => new GestureEngine({ tapWindowMs: 300, holdThresholdMs: 300 })).toThrow();
    expect(() => new GestureEngine({ tapWindowMs: 400, holdThresholdMs: 300 })).toThrow();
  });

  it('press without release emits press only', () => {
    const { engine, clock } = createManualGestureEngine({ tapWindowMs: 100, holdThresholdMs: 200 });
    const rec = recorder(engine, 'press', 'release', 'tap', 'hold');

    engine.press('x');
    expect(rec.types).toEqual(['press']);
    clock.advanceBy(50);
    expect(rec.types).toEqual(['press']);
  });

  it('duplicate press while already pressed is ignored', () => {
    const { engine, clock } = createManualGestureEngine({ tapWindowMs: 100, holdThresholdMs: 200 });
    const rec = recorder(engine, 'press');

    engine.press('x');
    clock.advanceBy(10);
    engine.press('x');
    clock.advanceBy(10);
    expect(rec.events.filter((e) => e.type === 'press')).toHaveLength(1);
  });

  it('release without press is a no-op', () => {
    const { engine } = createManualGestureEngine();
    const rec = recorder(engine, 'release');
    engine.release('x');
    expect(rec.events).toHaveLength(0);
  });
});

describe('tap', () => {
  it('emits tap for a press+release within the tap window (release at boundary counts as tap)', () => {
    const { engine, clock } = createManualGestureEngine({ tapWindowMs: 100, holdThresholdMs: 200 });
    const rec = recorder(engine, 'tap', 'hold', 'hold-release');

    engine.press('a');
    clock.advanceBy(50);
    engine.release('a');

    expect(rec.types).toEqual(['tap']);
    expect(rec.events[0]).toMatchObject({ switchId: 'a' });
  });

  it('a release just past the tap window (but before hold threshold) reports as hold-release', () => {
    const { engine, clock } = createManualGestureEngine({ tapWindowMs: 100, holdThresholdMs: 300 });
    const rec = recorder(engine, 'tap', 'hold-release');

    engine.press('a');
    clock.advanceBy(150);
    engine.release('a');

    expect(rec.types).toEqual(['hold-release']);
  });
});

describe('hold and repeat', () => {
  it('emits hold at the threshold and hold-release on later release', () => {
    const { engine, clock } = createManualGestureEngine({ tapWindowMs: 100, holdThresholdMs: 200 });
    const rec = recorder(engine, 'tap', 'hold', 'hold-release');

    engine.press('h');
    clock.advanceBy(200);
    expect(rec.types).toEqual(['hold']);
    clock.advanceBy(500);
    engine.release('h');
    expect(rec.types).toEqual(['hold', 'hold-release']);
  });

  it('emits repeat events at repeatIntervalMs while held (first repeat is one interval after hold)', () => {
    const { engine, clock } = createManualGestureEngine({
      tapWindowMs: 50,
      holdThresholdMs: 100,
      repeatIntervalMs: 80,
    });
    const rec = recorder(engine, 'hold', 'repeat');

    engine.press('r');
    clock.advanceBy(100); // hold fires; no repeat yet
    expect(rec.events.filter((e) => e.type === 'repeat')).toHaveLength(0);
    clock.advanceBy(80); // repeat count=1
    expect(rec.events.filter((e) => e.type === 'repeat')).toHaveLength(1);
    clock.advanceBy(80); // count=2
    expect(rec.events.filter((e) => e.type === 'repeat')).toHaveLength(2);
    clock.advanceBy(80); // count=3
    expect(rec.events.filter((e) => e.type === 'repeat')).toHaveLength(3);
    clock.advanceBy(80); // count=4
    expect(rec.events.filter((e) => e.type === 'repeat')).toHaveLength(4);
  });

  it('repeats stop firing after release', () => {
    const { engine, clock } = createManualGestureEngine({
      tapWindowMs: 50,
      holdThresholdMs: 100,
      repeatIntervalMs: 80,
    });
    const rec = recorder(engine, 'repeat');

    engine.press('r');
    clock.advanceBy(100); // hold fires
    clock.advanceBy(80);  // repeat count=1
    engine.release('r');
    clock.advanceBy(1000); // no further repeats
    expect(rec.events.filter((e) => e.type === 'repeat')).toHaveLength(1);
  });
});

describe('tremor filter', () => {
  it('ignores taps shorter than tremorFilterMs', () => {
    const { engine, clock } = createManualGestureEngine({
      tapWindowMs: 100,
      holdThresholdMs: 200,
      tremorFilterMs: 30,
    });
    const rec = recorder(engine, 'tap', 'release');

    engine.press('a');
    clock.advanceBy(20);
    engine.release('a');

    // release still fires (raw event), but no tap.
    expect(rec.types).toEqual(['release']);
  });
});

describe('repeat suppression', () => {
  it('ignores presses within the suppression window after a release', () => {
    const { engine, clock } = createManualGestureEngine({
      tapWindowMs: 100,
      holdThresholdMs: 300,
      repeatSuppressMs: 50,
    });
    const rec = recorder(engine, 'tap');

    engine.press('a');
    clock.advanceBy(20);
    engine.release('a'); // tap fires
    expect(rec.events).toHaveLength(1);

    // Immediate re-press is suppressed.
    engine.press('a');
    clock.advanceBy(20);
    engine.release('a');
    expect(rec.events).toHaveLength(1);

    // After 50ms it's accepted again.
    clock.advanceBy(50);
    engine.press('a');
    clock.advanceBy(20);
    engine.release('a');
    expect(rec.events).toHaveLength(2);
  });
});

describe('stuck-switch quarantine', () => {
  it('force-releases a switch held past stuckTimeoutMs', () => {
    const { engine, clock } = createManualGestureEngine({
      tapWindowMs: 50,
      holdThresholdMs: 100,
      stuckTimeoutMs: 5000,
    });
    const rec = recorder(engine, 'stuck', 'hold', 'hold-release', 'release');

    engine.press('s');
    clock.advanceBy(100); // hold fires
    clock.advanceBy(5000); // stuck fires, force-release
    expect(rec.types).toContain('stuck');
    expect(rec.types).toContain('hold');
    // Force-release emits raw `release` but no `hold-release`.
    expect(rec.types).toContain('release');
    expect(rec.types).not.toContain('hold-release');
    expect(engine.pressedSwitches).toEqual([]);
  });

  it('disabling stuckTimeoutMs keeps the press forever', () => {
    const { engine, clock } = createManualGestureEngine({
      tapWindowMs: 50,
      holdThresholdMs: 100,
      stuckTimeoutMs: 0,
    });
    engine.press('s');
    clock.advanceBy(1_000_000);
    expect(engine.pressedSwitches).toEqual(['s']);
  });
});

describe('disconnect and quarantine', () => {
  it('disconnect(sourceId) force-releases every press from that source', () => {
    const { engine, clock } = createManualGestureEngine({
      tapWindowMs: 100,
      holdThresholdMs: 1000,
    });
    const rec = recorder(engine, 'quarantine', 'release');

    engine.press('a', 'kbd');
    engine.press('b', 'kbd');
    engine.press('c', 'pointer');
    clock.advanceBy(10);
    engine.disconnect('kbd');

    expect(rec.events.filter((e) => e.type === 'quarantine').length).toBe(2);
    expect(rec.events.filter((e) => e.type === 'release').length).toBe(2);
    expect(engine.pressedSwitches).toEqual(['c']);
  });

  it('subsequent presses from a quarantined source are ignored until release', () => {
    const { engine } = createManualGestureEngine();
    const rec = recorder(engine, 'press', 'tap');

    engine.press('a', 'kbd');
    engine.disconnect('kbd');
    engine.press('a', 'kbd'); // ignored
    expect(rec.events.filter((e) => e.type === 'press')).toHaveLength(1);

    engine.release('a', 'kbd'); // real release — clears quarantine
    expect(engine.isQuarantined('a', 'kbd')).toBe(false);

    engine.press('a', 'kbd'); // accepted now
    expect(rec.events.filter((e) => e.type === 'press')).toHaveLength(2);
  });

  it('disconnect() with no source releases everything', () => {
    const { engine } = createManualGestureEngine();
    engine.press('a', 'kbd');
    engine.press('b', 'pointer');
    engine.disconnect();
    expect(engine.pressedSwitches).toEqual([]);
  });
});

describe('suspend', () => {
  it('releases every live press with only the raw release event', () => {
    const { engine, clock } = createManualGestureEngine({ tapWindowMs: 50, holdThresholdMs: 1000 });
    const rec = recorder(engine, 'release', 'tap', 'hold-release');
    engine.press('a');
    engine.press('b');
    clock.advanceBy(10);
    engine.suspend();
    expect(engine.pressedSwitches).toEqual([]);
    // Force-release does not synthesize gestures — only raw releases.
    expect(rec.events.filter((e) => e.type === 'release')).toHaveLength(2);
    expect(rec.events.some((e) => e.type === 'tap' || e.type === 'hold-release')).toBe(false);
  });
});

describe('listener isolation', () => {
  it('a throwing listener does not break other listeners', () => {
    const { engine, clock } = createManualGestureEngine({ tapWindowMs: 100, holdThresholdMs: 200 });
    let good = 0;
    engine.on('tap', () => { throw new Error('boom'); });
    engine.on('tap', () => { good++; });

    engine.press('a');
    clock.advanceBy(10);
    engine.release('a');

    expect(good).toBe(1);
  });

  it('unsubscribe stops the listener', () => {
    const { engine, clock } = createManualGestureEngine({ tapWindowMs: 100, holdThresholdMs: 200 });
    let count = 0;
    const unsub = engine.on('tap', () => { count++; });
    unsub();

    engine.press('a');
    clock.advanceBy(10);
    engine.release('a');

    expect(count).toBe(0);
  });
});

describe('dispose', () => {
  it('clears all state and accepts further calls', () => {
    const { engine } = createManualGestureEngine();
    engine.press('a');
    engine.dispose();
    expect(engine.pressedSwitches).toEqual([]);
    expect(() => engine.dispose()).not.toThrow();
  });
});
