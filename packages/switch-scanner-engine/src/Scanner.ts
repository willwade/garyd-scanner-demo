import type { FocusMeta, ScanCallbacks, ScanConfigProvider, ScanSurface, SwitchAction } from './types';
import { systemScheduler, type Cancel, type Scheduler } from './scheduler';
import type {
  DistributiveOmit,
  ScannerEvent,
  ScannerEventListener,
  ScannerSnapshot,
  SnapshotListener,
  Unsubscribe,
} from './events';

// Critical Overscan states
export enum OverscanState {
  FAST = 'fast',
  SLOW_BACKWARD = 'slow_backward',
}

export abstract class Scanner {
  protected surface: ScanSurface;
  protected config: ScanConfigProvider;
  protected callbacks: ScanCallbacks;
  protected scheduler: Scheduler;
  protected isRunning: boolean = false;
  protected timer: Cancel | null = null;
  protected stepCount: number = 0;
  protected overscanState: OverscanState = OverscanState.FAST;
  protected loopCount: number = 0;

  private currentHighlight: readonly number[] = [];
  private readonly snapshotListeners = new Set<SnapshotListener>();
  private readonly eventListeners = new Set<ScannerEventListener>();

  constructor(
    surface: ScanSurface,
    config: ScanConfigProvider,
    callbacks: ScanCallbacks = {},
    scheduler: Scheduler = systemScheduler(),
  ) {
    this.surface = this.wrapSurface(surface);
    this.config = config;
    this.callbacks = callbacks;
    this.scheduler = scheduler;
  }

  /**
   * Wrap the consumer's surface so every `setFocus` / `setSelected` call is
   * observed by the engine. This lets subclasses keep calling
   * `this.surface.setFocus(...)` directly while the base class still knows
   * when the highlight moved and can publish a snapshot + event.
   */
  private wrapSurface(consumer: ScanSurface): ScanSurface {
    const self = this;
    return {
      ...consumer,
      setFocus(indices: number[], meta?: FocusMeta) {
        consumer.setFocus(indices, meta);
        self.onHighlightChanged(indices, meta ?? null);
      },
      setSelected(index: number) {
        consumer.setSelected(index);
      },
    };
  }

  private onHighlightChanged(indices: readonly number[], meta: FocusMeta | null) {
    this.currentHighlight = [...indices];
    this.emitEvent({ type: 'highlight.changed', indices: this.currentHighlight, meta });
    this.notifySnapshot();
  }

  public start() {
    this.isRunning = true;
    this.stepCount = 0;
    this.loopCount = 0;
    this.overscanState = OverscanState.FAST;
    this.reset();
    this.emitEvent({ type: 'scan.started' });
    this.notifySnapshot();
    this.scheduleNextStep();
  }

  public stop() {
    const wasRunning = this.isRunning;
    this.isRunning = false;
    if (this.timer) {
      this.timer();
      this.timer = null;
    }
    this.surface.setFocus([]);
    if (wasRunning) {
      this.emitEvent({ type: 'scan.stopped' });
      this.notifySnapshot();
    }
  }

  public handleAction(action: SwitchAction): void {
    if (action === 'select') {
      this.handleSelectAction();
    } else if (action === 'step') {
      if (this.config.get().scanInputMode === 'manual') {
        this.step();
        this.callbacks.onScanStep?.();
        this.stepCount++;
        this.notifySnapshot();
      }
    } else if (action === 'reset') {
      this.loopCount = 0;
      this.reset();
      this.stepCount = 0;
      this.overscanState = OverscanState.FAST;
      this.emitEvent({ type: 'scan.reset' });
      this.notifySnapshot();
      if (this.config.get().scanInputMode === 'auto') {
        this.isRunning = true;
        this.cancelTimer();
        this.scheduleNextStep();
      }
    }
  }

  protected cancelTimer() {
    if (this.timer) {
      this.timer();
      this.timer = null;
    }
  }

  protected handleSelectAction() {
    const config = this.config.get();

    if (config.criticalOverscan.enabled) {
      if (this.overscanState === OverscanState.FAST) {
        const from = this.overscanState;
        this.overscanState = OverscanState.SLOW_BACKWARD;
        this.emitEvent({ type: 'overscan.transition', from, to: OverscanState.SLOW_BACKWARD });
        this.cancelTimer();
        this.scheduleNextStep();
        return;
      } else if (this.overscanState === OverscanState.SLOW_BACKWARD) {
        const from = this.overscanState;
        this.overscanState = OverscanState.FAST;
        this.emitEvent({ type: 'overscan.transition', from, to: OverscanState.FAST });
        this.doSelection();
        return;
      }
    }

    this.doSelection();
  }

  protected abstract step(): void;
  protected abstract reset(): void;

  protected reportCycleCompleted() {
    this.loopCount++;
    this.emitEvent({ type: 'cycle.completed', loopCount: this.loopCount });
    this.notifySnapshot();
    const config = this.config.get();
    if (config.scanLoops > 0 && this.loopCount >= config.scanLoops) {
      this.stop();
      this.loopCount = 0;
    }
  }

  protected scheduleNextStep() {
    if (!this.isRunning) return;

    const config = this.config.get();
    if (config.scanInputMode === 'manual') {
      return;
    }

    let rate: number;
    if (config.criticalOverscan.enabled && this.overscanState === OverscanState.SLOW_BACKWARD) {
      rate = config.criticalOverscan.slowRate;
    } else {
      const isFirstItem = this.stepCount === 0;
      rate = isFirstItem && config.initialItemPause > 0
        ? config.initialItemPause
        : (config.criticalOverscan.enabled ? config.criticalOverscan.fastRate : config.scanRate);
    }

    this.cancelTimer();

    this.timer = this.scheduler.schedule(() => {
      this.step();
      this.callbacks.onScanStep?.();
      this.stepCount++;
      this.scheduleNextStep();
    }, rate);
  }

  protected triggerSelection(index: number) {
    const item = this.surface.getItemData?.(index);
    if (item?.isEmpty) {
      this.emitEvent({ type: 'item.skipped', index });
      this.stepCount = 0;
      this.cancelTimer();
      this.scheduleNextStep();
      return;
    }

    this.surface.setSelected(index);
    this.callbacks.onSelect?.(index);
    this.emitEvent({ type: 'item.selected', index });
  }

  protected triggerRedraw() {
    this.callbacks.onRedraw?.();
  }

  public abstract getCost(itemIndex: number): number;

  protected abstract doSelection(): void;

  public mapContentToGrid<T>(content: T[], _rows: number, _cols: number): T[] {
    return content;
  }

  // ------------------------------------------------------------------
  // Public observation API
  // ------------------------------------------------------------------

  /** Current immutable state. Cheap to call; does not allocate listeners. */
  public getSnapshot(): ScannerSnapshot {
    return {
      status: this.isRunning ? 'scanning' : 'idle',
      highlight: this.currentHighlight,
      stepCount: this.stepCount,
      loopCount: this.loopCount,
      overscanState: this.loopCount >= 0 && this.config.get().criticalOverscan.enabled
        ? this.overscanState
        : null,
    };
  }

  /**
   * Subscribe to snapshot changes. The listener is called immediately once
   * with the current snapshot, then again whenever the engine's observable
   * state changes. Returns an unsubscribe function.
   */
  public subscribe(listener: SnapshotListener): Unsubscribe {
    this.snapshotListeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.snapshotListeners.delete(listener);
    };
  }

  /**
   * Subscribe to the event stream. Events are emitted at the moment the engine
   * mutates state. Returns an unsubscribe function. The listener is NOT called
   * immediately — use {@link getSnapshot} for current state.
   */
  public observe(listener: ScannerEventListener): Unsubscribe {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  protected emitEvent(event: DistributiveOmit<ScannerEvent, 'at'>) {
    const stamped = { ...event, at: this.scheduler.now() } as ScannerEvent;
    for (const listener of this.eventListeners) {
      try {
        listener(stamped);
      } catch {
        // Listeners must never break the engine.
      }
    }
  }

  protected notifySnapshot() {
    const snapshot = this.getSnapshot();
    for (const listener of this.snapshotListeners) {
      try {
        listener(snapshot);
      } catch {
        // Listeners must never break the engine.
      }
    }
  }
}
