import { describe, it, expect, vi } from 'vitest';
import { LinearScanner } from './scanners/LinearScanner';
import { createTestScanner } from './testing';

describe('Scanner.subscribe (snapshot channel)', () => {
  it('emits the current snapshot immediately on subscribe', () => {
    const { scanner } = createTestScanner(LinearScanner, { scanRate: 100 }, 4);
    const listener = vi.fn();
    scanner.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toMatchObject({
      status: 'idle',
      highlight: [],
      stepCount: 0,
      loopCount: 0,
    });
  });

  it('publishes a scanning snapshot on start, then new highlight on each tick', () => {
    const { scanner, clock } = createTestScanner(LinearScanner, { scanRate: 100 }, 3);
    const snapshots: ReturnType<typeof scanner.getSnapshot>[] = [];
    scanner.subscribe((s) => snapshots.push(s));

    scanner.start();
    // After start: status=_scanning, then reset() pushes highlight=[]
    expect(snapshots.at(-1)!.status).toBe('scanning');

    clock.advanceBy(100);
    expect(snapshots.at(-1)!.highlight).toEqual([0]);

    clock.advanceBy(100);
    expect(snapshots.at(-1)!.highlight).toEqual([1]);
  });

  it('unsubscribe stops the listener', () => {
    const { scanner, clock } = createTestScanner(LinearScanner, { scanRate: 100 }, 3);
    const listener = vi.fn();
    const unsub = scanner.subscribe(listener);
    listener.mockClear();

    unsub();
    scanner.start();
    clock.advanceBy(100);
    expect(listener).not.toHaveBeenCalled();
  });

  it('isolates subscribers from each other', () => {
    const { scanner, clock } = createTestScanner(LinearScanner, { scanRate: 100 }, 3);
    const a = vi.fn();
    const b = vi.fn();
    scanner.subscribe(a);
    scanner.subscribe(b);
    a.mockClear();
    b.mockClear();

    scanner.start();
    clock.advanceBy(100);

    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });
});

describe('Scanner.observe (event channel)', () => {
  it('emits scan.started on start with the scheduler timestamp', () => {
    const { scanner, clock } = createTestScanner(LinearScanner, { scanRate: 100 }, 3);
    const events: any[] = [];
    scanner.observe((e) => events.push(e));

    scanner.start();
    expect(events.find((e) => e.type === 'scan.started')).toBeDefined();
    expect(events.find((e) => e.type === 'scan.started').at).toBe(clock.time());
  });

  it('emits highlight.changed on every focus move', () => {
    const { scanner, clock } = createTestScanner(LinearScanner, { scanRate: 100 }, 3);
    const events: any[] = [];
    scanner.observe((e) => events.push(e));

    scanner.start();
    clock.advanceBy(100);
    clock.advanceBy(100);

    const highlights = events.filter((e) => e.type === 'highlight.changed');
    // reset() on start pushes [], then each tick pushes a real index.
    expect(highlights.length).toBeGreaterThanOrEqual(3);
    expect(highlights[1].indices).toEqual([0]);
    expect(highlights[2].indices).toEqual([1]);
  });

  it('emits item.selected on selection', () => {
    const { scanner, clock } = createTestScanner(LinearScanner, { scanRate: 100 }, 3);
    const events: any[] = [];
    scanner.observe((e) => events.push(e));

    scanner.start();
    clock.advanceBy(100); // item 0
    clock.advanceBy(100); // item 1
    scanner.handleAction('select');

    const selected = events.filter((e) => e.type === 'item.selected');
    expect(selected).toHaveLength(1);
    expect(selected[0].index).toBe(1);
  });

  it('emits item.skipped instead of item.selected when the target is empty', () => {
    const { scanner, clock, fixture } = createTestScanner(LinearScanner, { scanRate: 100 }, 3);
    fixture.markEmpty(1);
    const events: any[] = [];
    scanner.observe((e) => events.push(e));

    scanner.start();
    clock.advanceBy(100); // item 0
    clock.advanceBy(100); // item 1
    scanner.handleAction('select');

    expect(events.some((e) => e.type === 'item.selected')).toBe(false);
    expect(events.some((e) => e.type === 'item.skipped' && e.index === 1)).toBe(true);
  });

  it('emits scan.stopped on stop', () => {
    const { scanner, clock } = createTestScanner(LinearScanner, { scanRate: 100 }, 3);
    const events: any[] = [];
    scanner.observe((e) => events.push(e));

    scanner.start();
    clock.advanceBy(100);
    scanner.stop();

    expect(events.some((e) => e.type === 'scan.stopped')).toBe(true);
  });

  it('unsubscribe stops event delivery', () => {
    const { scanner } = createTestScanner(LinearScanner, { scanRate: 100 }, 3);
    const listener = vi.fn();
    const unsub = scanner.observe(listener);
    unsub();
    scanner.start();
    expect(listener).not.toHaveBeenCalled();
  });

  it('a throwing listener does not break the engine or other listeners', () => {
    const { scanner, clock } = createTestScanner(LinearScanner, { scanRate: 100 }, 3);
    const good = vi.fn();
    scanner.observe(() => {
      throw new Error('boom');
    });
    scanner.observe(good);

    expect(() => scanner.start()).not.toThrow();
    clock.advanceBy(100);
    expect(good).toHaveBeenCalled();
  });

  it('emits cycle.completed when the scan wraps', () => {
    const { scanner, clock } = createTestScanner(LinearScanner, { scanRate: 100 }, 3);
    const events: any[] = [];
    scanner.observe((e) => events.push(e));

    scanner.start();
    // LinearScanner with circular direction wraps after reaching the last item.
    clock.advanceBy(100); // 0
    clock.advanceBy(100); // 1
    clock.advanceBy(100); // 2
    clock.advanceBy(100); // wraps to 0 → reportCycleCompleted

    expect(events.some((e) => e.type === 'cycle.completed' && e.loopCount === 1)).toBe(true);
  });
});

describe('Scanner.getSnapshot', () => {
  it('does not subscribe the caller (no listener growth)', () => {
    const { scanner } = createTestScanner(LinearScanner, { scanRate: 100 }, 3);
    const before = (scanner as unknown as { snapshotListeners: Set<unknown> }).snapshotListeners.size;
    scanner.getSnapshot();
    scanner.getSnapshot();
    scanner.getSnapshot();
    const after = (scanner as unknown as { snapshotListeners: Set<unknown> }).snapshotListeners.size;
    expect(after).toBe(before);
  });
});
