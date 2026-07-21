import { describe, it, expect } from 'vitest';
import { LinearScanner } from '../scanners/LinearScanner';
import { createTestScanner, createFixture } from './index';

describe('createTestScanner', () => {
  it('constructs a scanner wired to a manual scheduler and fixture', () => {
    const { clock, scanner, fixture } = createTestScanner(
      LinearScanner,
      { scanRate: 500 },
      4,
    );

    expect(fixture.items).toHaveLength(4);
    expect(fixture.focusCalls).toEqual([]);
    expect(clock.time()).toBe(0);

    scanner.start();
    // start() calls reset() which clears focus to [], then schedules the
    // first timed step. Nothing has fired yet after the timed step.
    expect(fixture.focusCalls).toEqual([[]]);

    clock.advanceBy(500);
    expect(fixture.focusCalls).toEqual([[], [0]]);
    clock.advanceBy(500);
    expect(fixture.focusCalls).toEqual([[], [0], [1]]);
  });

  it('records selections', () => {
    const { clock, scanner, fixture } = createTestScanner(
      LinearScanner,
      { scanRate: 250 },
      3,
    );

    scanner.start();
    clock.advanceBy(250); // focus item 0
    clock.advanceBy(250); // focus item 1
    scanner.handleAction('select');

    expect(fixture.selected).toEqual([1]);
  });

  it('live config reconfiguration takes effect after the in-flight tick', () => {
    const { clock, scanner, fixture, setConfig } = createTestScanner(
      LinearScanner,
      { scanRate: 100 },
      4,
    );

    scanner.start();
    clock.advanceBy(100);
    // reset() → [], then first tick → [0]
    expect(fixture.focusCalls).toEqual([[], [0]]);

    // The next tick is already scheduled at t=200 with the old rate.
    // setConfig changes the rate, but the in-flight callback still fires on
    // its original deadline; only the *following* tick uses the new rate.
    setConfig({ scanRate: 1000 });
    clock.advanceBy(100);
    expect(fixture.focusCalls).toEqual([[], [0], [1]]);
    // Now the new rate (1000ms) applies — the next tick should not fire at t=300.
    clock.advanceBy(900);
    expect(fixture.focusCalls).toEqual([[], [0], [1]]);
    // ...but it should fire at t=1200 (200 + 1000).
    clock.advanceBy(100);
    expect(fixture.focusCalls).toEqual([[], [0], [1], [2]]);
  });

  it('does not depend on real timers (no wall-clock wait)', () => {
    const start = Date.now();
    const { clock, scanner } = createTestScanner(
      LinearScanner,
      { scanRate: 60_000 },
      4,
    );
    scanner.start();
    clock.advanceBy(60_000);
    clock.advanceBy(60_000);
    clock.advanceBy(60_000);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000); // would be 3 minutes if we used real timers
  });
});

describe('createFixture', () => {
  it('marks items as empty when requested', () => {
    const fixture = createFixture([
      { id: 0, label: 'a' },
      { id: 1, label: 'b' },
    ]);
    expect(fixture.surface.getItemData?.(0)).toEqual({ label: 'a', isEmpty: false });
    fixture.markEmpty(0);
    expect(fixture.surface.getItemData?.(0)).toEqual({ label: 'a', isEmpty: true });
    fixture.markEmpty(0, false);
    expect(fixture.surface.getItemData?.(0)).toEqual({ label: 'a', isEmpty: false });
  });

  it('returns null for unknown indices', () => {
    const fixture = createFixture([{ id: 0, label: 'only' }]);
    expect(fixture.surface.getItemData?.(42)).toBeNull();
  });
});
