import { describe, it, expect } from 'vitest';
import { manualScheduler, systemScheduler } from './scheduler';

describe('manualScheduler', () => {
  it('starts at the given time', () => {
    const s = manualScheduler(100);
    expect(s.time()).toBe(100);
    expect(s.now()).toBe(100);
  });

  it('does not fire jobs before their deadline', () => {
    const s = manualScheduler();
    let fired = 0;
    s.schedule(() => fired++, 100);
    s.advanceBy(99);
    expect(fired).toBe(0);
    expect(s.pending()).toBe(1);
  });

  it('fires jobs when their deadline arrives', () => {
    const s = manualScheduler();
    const order: string[] = [];
    s.schedule(() => order.push('a'), 100);
    s.schedule(() => order.push('b'), 200);
    s.advanceBy(100);
    expect(order).toEqual(['a']);
    s.advanceBy(100);
    expect(order).toEqual(['a', 'b']);
    expect(s.pending()).toBe(0);
  });

  it('respects insertion order when deadlines tie', () => {
    const s = manualScheduler();
    const order: string[] = [];
    s.schedule(() => order.push('first'), 100);
    s.schedule(() => order.push('second'), 100);
    s.advanceBy(100);
    expect(order).toEqual(['first', 'second']);
  });

  it('fires earlier-deadline job scheduled later first', () => {
    const s = manualScheduler();
    const order: string[] = [];
    s.schedule(() => order.push('late-scheduled'), 100);
    s.schedule(() => order.push('earlier-deadline'), 50);
    s.advanceBy(100);
    expect(order).toEqual(['earlier-deadline', 'late-scheduled']);
  });

  it('Cancel prevents the callback if not yet fired', () => {
    const s = manualScheduler();
    let fired = 0;
    const cancel = s.schedule(() => fired++, 100);
    cancel();
    s.advanceBy(100);
    expect(fired).toBe(0);
    expect(s.pending()).toBe(0);
  });

  it('Cancel is safe to call after the callback already ran', () => {
    const s = manualScheduler();
    let fired = 0;
    const cancel = s.schedule(() => fired++, 100);
    s.advanceBy(100);
    expect(() => cancel()).not.toThrow();
    expect(fired).toBe(1);
  });

  it('advanceTo moves time forward to the target and fires due jobs', () => {
    const s = manualScheduler();
    let fired = 0;
    s.schedule(() => fired++, 250);
    s.advanceTo(250);
    expect(fired).toBe(1);
    expect(s.time()).toBe(250);
  });

  it('advanceTo does not move time backwards', () => {
    const s = manualScheduler(500);
    s.schedule(() => {}, 1000);
    s.advanceTo(100);
    expect(s.time()).toBe(500);
  });

  it('flush runs every pending job regardless of deadline', () => {
    const s = manualScheduler();
    const order: string[] = [];
    s.schedule(() => order.push('a'), 1000);
    s.schedule(() => order.push('b'), 100);
    s.schedule(() => order.push('c'), 500);
    s.flush();
    expect(order).toEqual(['b', 'c', 'a']);
    expect(s.pending()).toBe(0);
  });

  it('a scheduled job can schedule another job that fires later', () => {
    const s = manualScheduler();
    const order: number[] = [];
    s.schedule(() => {
      order.push(s.time());
      s.schedule(() => order.push(s.time()), 100);
    }, 100);
    s.advanceBy(100);
    expect(order).toEqual([100]);
    s.advanceBy(100);
    expect(order).toEqual([100, 200]);
  });

  it('a job scheduled from within a firing job runs in the same advance if due', () => {
    const s = manualScheduler();
    const order: number[] = [];
    s.schedule(() => {
      order.push(`outer@${s.time()}`);
      // Schedule something that is already "due" (delay 0) — should fire
      // in the same advanceBy loop.
      s.schedule(() => order.push(`inner@${s.time()}`), 0);
    }, 100);
    s.advanceBy(100);
    expect(order).toEqual(['outer@100', 'inner@100']);
  });
});

describe('systemScheduler', () => {
  it('now returns a monotonic number', () => {
    const s = systemScheduler();
    const a = s.now();
    const b = s.now();
    expect(b).toBeGreaterThanOrEqual(a);
  });

  it('schedule fires after the delay (smoke)', async () => {
    const s = systemScheduler();
    let fired = false;
    const cancel = s.schedule(() => (fired = true), 5);
    await new Promise((r) => setTimeout(r, 30));
    expect(fired).toBe(true);
    expect(() => cancel()).not.toThrow();
  });

  it('Cancel prevents the callback from firing', async () => {
    const s = systemScheduler();
    let fired = false;
    const cancel = s.schedule(() => (fired = true), 20);
    cancel();
    await new Promise((r) => setTimeout(r, 50));
    expect(fired).toBe(false);
  });
});
