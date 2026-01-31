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

  public getCost(itemIndex: number): number {
    let start = 0;
    let end = this.renderer.getItemsCount();
    let cost = 0;

    // Simulate the elimination process
    while (end - start > 1) {
      const mid = start + Math.ceil((end - start) / 2);

      // Determine if item is in first or second half
      if (itemIndex < mid) {
        // In first half [start, mid)
        // Scanner logic: highlights 2nd half (step 1), then 1st half (step 2)
        // Wait... step() flips currentHalf.
        // Initial currentHalf=0. step() -> 1 (Highlight 2nd half).
        // Next step() -> 0 (Highlight 1st half).
        // So:
        // Step 1: 2nd half highlighted. (Item NOT here).
        // Step 2: 1st half highlighted. (Item IS here). Select!
        cost += 2;
        end = mid; // Narrow to first half
      } else {
        // In second half [mid, end)
        // Step 1: 2nd half highlighted. (Item IS here). Select!
        cost += 1;
        start = mid; // Narrow to second half
      }
    }

    // Final selection of the single item (Cost += 1 for the click?)
    // The loop handles the drilling down. The last step is selecting the single item?
    // In handleAction: "if (rangeSize <= 1) ... triggerSelection".
    // Does it scan the single item?
    // Usually once isolated, it's selected immediately or requires confirmation.
    // The code says: `if (rangeSize <= 1) ...` inside handleAction logic.
    // But `handleAction` is called when user clicks.
    // If rangeSize is 1, user clicks to confirm?
    // If rangeSize <= 1, the scanner probably highlights that item?
    // "reset() sets rangeStart=0".
    // Actually, after drilling down, if rangeSize <= 1, it stops?
    // The code doesn't explicitly show scanning the single item.
    // It assumes the last click on a group of 1 selects it.
    // So the costs accumulated in the loop are sufficient.

    return cost;
  }
}
