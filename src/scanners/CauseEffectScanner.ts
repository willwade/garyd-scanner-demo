import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';

export class CauseEffectScanner extends Scanner {
  public start() {
    this.isRunning = true;
    this.reset();

    // In Cause & Effect, we typically focus everything or the single item immediately.
    // We do NOT schedule a step timer.
    const count = this.renderer.getItemsCount();
    if (count > 0) {
        // Focus all items to indicate they are "active" / ready
        const indices = Array.from({ length: count }, (_, i) => i);
        this.renderer.setFocus(indices);
    }
  }

  public handleAction(_action: SwitchAction): void {
    if (!this.isRunning) return;

    // For Cause & Effect, ANY switch action typically triggers the effect.
    // We trigger selection on all items (or the first one if singular).

    const count = this.renderer.getItemsCount();
    if (count > 0) {
        // Just select the first one as the "event" source, or all?
        // Usually visual feedback on the item is desired.
        // We'll select index 0 by default for simplicity, or we can iterate.
        // If there's only 1 item, index 0 is correct.

        const item = this.renderer.getItem(0);
        if (item) {
             this.triggerSelection(item);
             this.renderer.setSelected(0);
        }
    }
  }

  protected step(): void {
    // No scanning step in Cause & Effect
  }

  protected reset(): void {
    // Reset focus?
    const count = this.renderer.getItemsCount();
    if (count > 0) {
        const indices = Array.from({ length: count }, (_, i) => i);
        this.renderer.setFocus(indices);
    }
  }

  public getCost(_itemIndex: number): number {
    return 1; // Constant cost
  }
}
