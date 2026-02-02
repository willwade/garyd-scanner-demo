import { GridRenderer, GridItem } from '../GridRenderer';
import { ConfigManager } from '../ConfigManager';
import { AudioManager } from '../AudioManager';
import { SwitchAction } from '../SwitchInput';

// Critical Overscan states
export enum OverscanState {
  FAST = 'fast',           // Fast forward scanning
  SLOW_BACKWARD = 'slow_backward',  // Slow backward scanning
}

export abstract class Scanner {
  protected renderer: GridRenderer;
  protected config: ConfigManager;
  protected audio: AudioManager;
  protected isRunning: boolean = false;
  protected timer: number | null = null;
  protected stepCount: number = 0; // Track steps for initial item pause
  protected overscanState: OverscanState = OverscanState.FAST; // Critical overscan state
  protected loopCount: number = 0; // Track completed scan cycles
  protected previousIndex: number = -1; // Track previous index to detect cycle completion

  constructor(renderer: GridRenderer, config: ConfigManager, audio: AudioManager) {
    this.renderer = renderer;
    this.config = config;
    this.audio = audio;
  }

  public start() {
    this.isRunning = true;
    this.stepCount = 0; // Reset step count
    this.loopCount = 0; // Reset loop count
    this.overscanState = OverscanState.FAST; // Reset overscan state
    this.reset();
    this.scheduleNextStep();
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.renderer.setFocus([]);
  }

  public handleAction(action: SwitchAction): void {
    if (action === 'select') {
      this.handleSelectAction();
    } else if (action === 'step') {
      // Manual step - only works in manual mode
      if (this.config.get().scanInputMode === 'manual') {
        this.step();
        this.stepCount++;
        this.audio.playScanSound();
      }
    } else if (action === 'reset') {
      this.loopCount = 0; // Reset loop count
      this.reset();
      this.stepCount = 0; // Reset step count on reset action
      this.overscanState = OverscanState.FAST; // Reset overscan state
      // Restart timer if in auto mode
      if (this.config.get().scanInputMode === 'auto') {
        this.isRunning = true; // Ensure we're running before scheduling
        if (this.timer) clearTimeout(this.timer);
        this.scheduleNextStep();
      }
    }
  }

  protected handleSelectAction() {
    const config = this.config.get();

    // If critical overscan is enabled, handle state transitions
    if (config.criticalOverscan.enabled) {
      if (this.overscanState === OverscanState.FAST) {
        // First select: transition to slow backward scanning
        this.overscanState = OverscanState.SLOW_BACKWARD;
        // Restart timer with slow backward rate
        if (this.timer) clearTimeout(this.timer);
        this.scheduleNextStep();
        return;
      } else if (this.overscanState === OverscanState.SLOW_BACKWARD) {
        // Second select: trigger selection and reset to FAST
        this.overscanState = OverscanState.FAST;
        // Perform the actual selection
        this.doSelection();
        return;
      }
    }

    // Critical overscan disabled: perform selection immediately
    this.doSelection();
  }

  protected abstract step(): void;
  protected abstract reset(): void;

  /**
   * Called by subclasses to report when a scan cycle has completed.
   * Subclasses should call this when they detect wrapping from the last item back to the first.
   */
  protected reportCycleCompleted() {
    this.loopCount++;
    const config = this.config.get();

    // Check if we've reached the loop limit
    if (config.scanLoops > 0 && this.loopCount >= config.scanLoops) {
      // Stop scanning
      this.stop();
      this.loopCount = 0; // Reset for next start
    }
  }

  protected scheduleNextStep() {
    if (!this.isRunning) return;

    const config = this.config.get();

    // Don't auto-schedule steps in manual mode
    if (config.scanInputMode === 'manual') {
      return;
    }

    // Determine the scan rate based on critical overscan state
    let rate: number;
    if (config.criticalOverscan.enabled && this.overscanState === OverscanState.SLOW_BACKWARD) {
      // Slow backward scanning
      rate = config.criticalOverscan.slowRate;
    } else {
      // Normal or fast scanning
      // Use initialItemPause for first item (stepCount === 0)
      const isFirstItem = this.stepCount === 0;
      rate = isFirstItem && config.initialItemPause > 0
        ? config.initialItemPause
        : (config.criticalOverscan.enabled ? config.criticalOverscan.fastRate : config.scanRate);
    }

    if (this.timer) clearTimeout(this.timer);

    this.timer = window.setTimeout(() => {
      this.step();
      this.audio.playScanSound();
      this.stepCount++; // Increment after stepping
      this.scheduleNextStep();
    }, rate);
  }

  protected triggerSelection(item: GridItem) {
    // Check if this is an empty item (for scan cancellation/reset)
    if (item.isEmpty) {
      // Don't trigger output, just reset the scan
      this.stepCount = 0; // Reset to start
      if (this.timer) clearTimeout(this.timer);
      this.scheduleNextStep(); // Restart from beginning
      return;
    }

    // Flash selection
    // Dispatch event on the container so it can be scoped
    const event = new CustomEvent('scanner:selection', {
      detail: { item },
      bubbles: true,
      composed: true // Allows crossing shadow boundary if needed (though we listen inside shadow)
    });
    this.renderer.getContainer().dispatchEvent(event);
    this.audio.playSelectSound();
  }

  protected triggerRedraw() {
    const event = new CustomEvent('scanner:redraw', {
        bubbles: true,
        composed: true
    });
    this.renderer.getContainer().dispatchEvent(event);
  }

  public abstract getCost(itemIndex: number): number;

  /**
   * Perform the actual selection action.
   * Called by handleAction when in appropriate overscan state or when overscan is disabled.
   */
  protected abstract doSelection(): void;

  /**
   * Reorders the linear content to match the visual flow of the scanner.
   * Default implementation returns content as-is (Row-Major).
   */
  public mapContentToGrid(content: GridItem[], _rows: number, _cols: number): GridItem[] {
      return content;
  }
}
