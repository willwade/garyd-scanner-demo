import type { FocusMeta } from './types';
import type { OverscanState } from './Scanner';

/**
 * Immutable view of the scanner's current state. Read via `scanner.getSnapshot()`
 * and pushed to subscribers on every meaningful change. Designed for
 * `useSyncExternalStore` so React components can select a slice without
 * re-rendering on every tick.
 */
export interface ScannerSnapshot {
  /** `'idle'` before start and after stop, `'scanning'` while running. */
  status: 'idle' | 'scanning';
  /** Indices the engine is currently highlighting (the last `setFocus` call). */
  highlight: readonly number[];
  /** Number of steps taken since `start()`. */
  stepCount: number;
  /** Number of completed cycles since `start()`. */
  loopCount: number;
  /** Current critical-overscan phase, or `null` if disabled. */
  overscanState: OverscanState | null;
}

/**
 * Discriminated union of every event the scanner emits. Use `scanner.observe()`
 * to subscribe. Events are emitted at the moment the engine mutates state; the
 * `at` timestamp comes from the scheduler's clock so it is deterministic in
 * tests.
 *
 * Events are for feedback (audio, analytics, logging, the event log). State
 * that drives rendering should come from {@link ScannerSnapshot} instead.
 */
export type ScannerEvent =
  | { type: 'scan.started'; at: number }
  | { type: 'scan.stopped'; at: number }
  | { type: 'scan.reset'; at: number }
  | { type: 'highlight.changed'; at: number; indices: readonly number[]; meta: FocusMeta | null }
  | { type: 'item.selected'; at: number; index: number }
  | { type: 'item.skipped'; at: number; index: number }
  | { type: 'cycle.completed'; at: number; loopCount: number }
  | { type: 'overscan.transition'; at: number; from: OverscanState; to: OverscanState };

export type ScannerEventListener = (event: ScannerEvent) => void;
export type SnapshotListener = (snapshot: ScannerSnapshot) => void;
export type Unsubscribe = () => void;

/**
 * Distributive Omit — applies `Omit` to each member of the union separately
 * so the discriminator (and member-only fields) survive. Without this,
 * `Omit<ScannerEvent, 'at'>` collapses to a single object type and loses
 * narrowing on `type`.
 */
export type DistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;

/** An event without its `at` timestamp; the engine stamps it on emit. */
export type UntimestampedEvent = DistributiveOmit<ScannerEvent, 'at'>;
