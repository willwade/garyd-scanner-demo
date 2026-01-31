import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';

export class EliminationScanner extends Scanner {
  private rangeStart: number = 0;
  private rangeEnd: number = 0; // Exclusive
  private currentHalf: 0 | 1 = 0; // 0 = first half, 1 = second half

  public start() {
    this.rangeStart = 0;
    this.rangeEnd = this.renderer.getItemsCount();
    super.start();
  }

  protected reset() {
    this.rangeStart = 0;
    this.rangeEnd = this.renderer.getItemsCount();
    this.currentHalf = 0;
    this.renderer.setFocus([]);
  }

  protected step() {
    // Toggle between halves
    this.currentHalf = this.currentHalf === 0 ? 1 : 0;
    this.highlightCurrentHalf();
  }

  private highlightCurrentHalf() {
    const rangeSize = this.rangeEnd - this.rangeStart;
    const mid = this.rangeStart + Math.ceil(rangeSize / 2);

    let start, end;
    if (this.currentHalf === 0) {
        start = this.rangeStart;
        end = mid;
    } else {
        start = mid;
        end = this.rangeEnd;
    }

    const indices: number[] = [];
    for (let i = start; i < end; i++) indices.push(i);
    this.renderer.setFocus(indices);
  }

  public handleAction(action: SwitchAction) {
    if (action === 'select') {
        const rangeSize = this.rangeEnd - this.rangeStart;
        if (rangeSize <= 1) {
            // Selected single item
            const item = this.renderer.getItem(this.rangeStart);
            if (item) {
                this.triggerSelection(item);
                this.reset();
                this.restartTimer();
            }
            return;
        }

        // Drill down
        const mid = this.rangeStart + Math.ceil(rangeSize / 2);
        if (this.currentHalf === 0) {
            this.rangeEnd = mid;
        } else {
            this.rangeStart = mid;
        }

        // Reset to scan first half of new range
        this.currentHalf = 1; // Will flip to 0 on step?
        // Actually we want to start scanning immediatley.
        // If we just shrank the range, we should probably pause and highlight the new full range?
        // Or immediately start alternating sub-halves.

        // Let's set currentHalf to 1 so step() flips it to 0.
        this.currentHalf = 1;
        this.restartTimer();

    } else if (action === 'cancel') {
        // Go back up?
        // Hard to know previous split.
        // For simplicity, reset.
        this.reset();
        this.restartTimer();
    }
  }

  private restartTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.scheduleNextStep();
  }
}
