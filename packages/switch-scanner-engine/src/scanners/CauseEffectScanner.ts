import { Scanner } from '../Scanner';
import type { SwitchAction } from '../types';

export class CauseEffectScanner extends Scanner {
  public start() {
    this.isRunning = true;
    this.reset();

    // In Cause & Effect, we typically focus everything or the single item immediately.
    // We do NOT schedule a step timer.
    const count = this.surface.getItemsCount();
    if (count > 0) {
        // Focus all items to indicate they are "active" / ready
        const indices = Array.from({ length: count }, (_, i) => i);
        const cfg = this.config.get();
        this.surface.setFocus(indices, {
          phase: 'major',
          scanRate: cfg.scanRate,
          scanPattern: cfg.scanPattern,
          scanTechnique: cfg.scanTechnique,
          scanDirection: cfg.scanDirection,
        });
    }
  }

  public handleAction(action: SwitchAction): void {
    if (action === 'select' && this.isRunning) {
      // Let base class handle select with critical overscan logic
      super.handleAction(action);
    }
  }

  protected doSelection() {
    // For Cause & Effect, ANY switch action typically triggers the effect.
    // We trigger selection on all items (or the first one if singular).

    const count = this.surface.getItemsCount();
    if (count > 0) {
      // Just select the first one as the "event" source, or all?
      // Usually visual feedback on the item is desired.
      // We'll select index 0 by default for simplicity, or we can iterate.
      // If there's only 1 item, index 0 is correct.

      this.triggerSelection(0);
    }
  }

  protected step(): void {
    // No scanning step in Cause & Effect
  }

  protected reset(): void {
    // Reset focus?
    const count = this.surface.getItemsCount();
    if (count > 0) {
      const indices = Array.from({ length: count }, (_, i) => i);
      const cfg = this.config.get();
      this.surface.setFocus(indices, {
        phase: 'major',
        scanRate: cfg.scanRate,
        scanPattern: cfg.scanPattern,
        scanTechnique: cfg.scanTechnique,
        scanDirection: cfg.scanDirection,
      });
    }
  }

  public getCost(_itemIndex: number): number {
    return 1; // Constant cost
  }
}
