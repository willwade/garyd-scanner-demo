/**
 * Scheduler port used by all scanners for timed work.
 *
 * Production code uses {@link systemScheduler}, which wraps `setTimeout`. Tests
 * can pass in a {@link manualScheduler} to drive time deterministically without
 * vitest fake timers or jsdom.
 *
 * The engine never calls `setTimeout`, `clearTimeout`, `Date.now`, or
 * `performance.now` directly — it always goes through this port, so the entire
 * scan loop is deterministic and SSR-safe.
 */

export type Cancel = () => void;

export interface Scheduler {
  /**
   * Run `fn` at least `delayMs` milliseconds in the future. Returns a Cancel
   * function; calling it prevents the callback if it hasn't fired yet. It is
   * safe to call Cancel after the callback has already run.
   */
  schedule(fn: () => void, delayMs: number): Cancel;
  /** Monotonic clock in milliseconds. Used for diagnostic timestamps. */
  now(): number;
}

/**
 * Real-time scheduler backed by `setTimeout` and `performance.now`. This is
 * the default for all production scanners.
 */
export function systemScheduler(): Scheduler {
  return {
    schedule(fn, delayMs) {
      const handle = setTimeout(fn, delayMs);
      return () => clearTimeout(handle);
    },
    now() {
      return typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    },
  };
}

interface PendingJob {
  fn: () => void;
  deadline: number;
  seq: number;
}

/**
 * Deterministic scheduler for tests. Time only advances when you call
 * {@link ManualScheduler.advanceBy} / {@link ManualScheduler.advanceTo} /
 * {@link ManualScheduler.flush}. Scheduled jobs fire in (deadline, seq) order
 * so a later-scheduled job with an earlier deadline runs first, matching real
 * timer semantics.
 *
 * @example
 * ```ts
 * const clock = manualScheduler();
 * const scanner = new LinearScanner(surface, config, {}, clock);
 * scanner.start();
 * clock.advanceBy(800); // fires one tick
 * ```
 */
export interface ManualScheduler extends Scheduler {
  /** Current virtual time in milliseconds. */
  time(): number;
  /** Advance virtual time by `ms` milliseconds, firing any due jobs. */
  advanceBy(ms: number): void;
  /** Advance virtual time to `timestamp`, firing any due jobs. */
  advanceTo(timestamp: number): void;
  /** Run every pending job regardless of deadline, in deadline order. */
  flush(): void;
  /** Number of jobs currently waiting. Useful for assertions. */
  pending(): number;
}

export function manualScheduler(startAt: number = 0): ManualScheduler {
  let time = startAt;
  let seq = 0;
  const queue: PendingJob[] = [];

  function fireDue() {
    queue.sort((a, b) => a.deadline - b.deadline || a.seq - b.seq);
    while (queue.length > 0 && queue[0].deadline <= time) {
      const job = queue.shift()!;
      job.fn();
    }
  }

  return {
    schedule(fn, delayMs) {
      const deadline = time + Math.max(0, delayMs);
      const mySeq = seq++;
      const job: PendingJob = { fn, deadline, seq: mySeq };
      queue.push(job);
      return () => {
        const idx = queue.indexOf(job);
        if (idx >= 0) queue.splice(idx, 1);
      };
    },
    now() {
      return time;
    },
    time() {
      return time;
    },
    advanceBy(ms) {
      time += ms;
      fireDue();
    },
    advanceTo(timestamp) {
      time = Math.max(time, timestamp);
      fireDue();
    },
    flush() {
      queue.sort((a, b) => a.deadline - b.deadline || a.seq - b.seq);
      while (queue.length > 0) {
        const job = queue.shift()!;
        time = Math.max(time, job.deadline);
        job.fn();
      }
    },
    pending() {
      return queue.length;
    },
  };
}
