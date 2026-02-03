import type { ScanCallbacks, ScanConfigProvider, ScanSurface, SwitchAction } from './types';

// Critical Overscan states
export enum OverscanState {
  FAST = 'fast',
  SLOW_BACKWARD = 'slow_backward',
}

export abstract class Scanner {
  protected surface: ScanSurface;
  protected config: ScanConfigProvider;
  protected callbacks: ScanCallbacks;
  protected isRunning: boolean = false;
  protected timer: number | null = null;
  protected stepCount: number = 0;
  protected overscanState: OverscanState = OverscanState.FAST;
  protected loopCount: number = 0;

  constructor(surface: ScanSurface, config: ScanConfigProvider, callbacks: ScanCallbacks = {}) {
    this.surface = surface;
    this.config = config;
    this.callbacks = callbacks;
  }

  public start() {
    this.isRunning = true;
    this.stepCount = 0;
    this.loopCount = 0;
    this.overscanState = OverscanState.FAST;
    this.reset();
    this.scheduleNextStep();
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.surface.setFocus([]);
  }

  public handleAction(action: SwitchAction): void {
    if (action === 'select') {
      this.handleSelectAction();
    } else if (action === 'step') {
      if (this.config.get().scanInputMode === 'manual') {
        this.step();
        this.stepCount++;
        this.callbacks.onScanStep?.();
      }
    } else if (action === 'reset') {
      this.loopCount = 0;
      this.reset();
      this.stepCount = 0;
      this.overscanState = OverscanState.FAST;
      if (this.config.get().scanInputMode === 'auto') {
        this.isRunning = true;
        if (this.timer) clearTimeout(this.timer);
        this.scheduleNextStep();
      }
    }
  }

  protected handleSelectAction() {
    const config = this.config.get();

    if (config.criticalOverscan.enabled) {
      if (this.overscanState === OverscanState.FAST) {
        this.overscanState = OverscanState.SLOW_BACKWARD;
        if (this.timer) clearTimeout(this.timer);
        this.scheduleNextStep();
        return;
      } else if (this.overscanState === OverscanState.SLOW_BACKWARD) {
        this.overscanState = OverscanState.FAST;
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

    if (this.timer) clearTimeout(this.timer);

    this.timer = window.setTimeout(() => {
      this.step();
      this.callbacks.onScanStep?.();
      this.stepCount++;
      this.scheduleNextStep();
    }, rate);
  }

  protected triggerSelection(index: number) {
    const item = this.surface.getItemData?.(index);
    if (item?.isEmpty) {
      this.stepCount = 0;
      if (this.timer) clearTimeout(this.timer);
      this.scheduleNextStep();
      return;
    }

    this.surface.setSelected(index);
    this.callbacks.onSelect?.(index);
  }

  protected triggerRedraw() {
    this.callbacks.onRedraw?.();
  }

  public abstract getCost(itemIndex: number): number;

  protected abstract doSelection(): void;

  public mapContentToGrid<T>(content: T[], _rows: number, _cols: number): T[] {
    return content;
  }
}
