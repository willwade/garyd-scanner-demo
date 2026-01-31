import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';

export class SnakeScanner extends Scanner {
  private currentIndex: number = -1;
  private totalItems: number = 0;
  private currentFocusIndex: number = -1;

  public start() {
    this.totalItems = this.renderer.getItemsCount();
    super.start();
  }

  protected reset() {
    this.currentIndex = -1;
    this.currentFocusIndex = -1;
    this.renderer.setFocus([]);
  }

  protected step() {
    this.currentIndex++;
    if (this.currentIndex >= this.totalItems) {
      this.currentIndex = 0;
    }

    const cols = this.renderer.columns;
    const row = Math.floor(this.currentIndex / cols);
    const col = this.currentIndex % cols;

    let actualIndex = this.currentIndex;

    if (row % 2 === 1) {
      // Odd row: Reverse column order
      // We need to map `col` (0..cols-1) to (cols-1..0)
      // But we must respect the actual items in this row if it's the last row?
      // Snake usually fills the grid visually.
      // If we have 10 items, 4 cols.
      // 0 1 2 3
      // 7 6 5 4
      // 8 9
      // The "Linear Snake" logic traverses 0->1->2->3->4->5->6->7->8->9.
      // My `currentIndex` logic above naturally does 0..Total-1.
      // So I just need to map `currentIndex` to `gridCoordinate`.
      // Wait. Linear Snake means the *path* is snake-like.
      // 0,1,2,3 are top row. 4,5,6,7 are next row (visually).
      // If I want to SCAN 0,1,2,3 then 7,6,5,4...
      // That means at step 4 (index 4), I should be highlighting item 7?
      // Yes.

      const rowStart = row * cols;
      // For odd rows, we want to iterate R->L.
      // Visual index at this row/col is: rowStart + (cols - 1 - col).
      actualIndex = rowStart + (cols - 1 - col);
    }

    // Check if valid
    const item = this.renderer.getItem(actualIndex);
    if (!item) {
        // If we hit an empty cell (e.g. end of last row reversed, or incomplete row),
        // we should skip it.
        // Since we are inside a timer loop, we can just call step() again immediately?
        // Or better, find the next valid one in a loop here.
        // But `step` is called by timer.

        // Let's just try next one immediately.
        // return this.step(); // Recursion risk if all empty?
        // We'll trust totalItems > 0.
        this.step();
        return;
    }

    this.currentFocusIndex = actualIndex;
    this.renderer.setFocus([actualIndex]);
  }

  public handleAction(action: SwitchAction) {
    if (action === 'select') {
      if (this.currentFocusIndex >= 0) {
        const item = this.renderer.getItem(this.currentFocusIndex);
        if (item) {
          this.renderer.setSelected(this.currentFocusIndex);
          this.triggerSelection(item);
          this.reset();
          if (this.timer) clearTimeout(this.timer);
          this.scheduleNextStep();
        }
      }
    } else if (action === 'step') {
      if (this.timer) clearTimeout(this.timer);
      this.step();
      this.audio.playScanSound();
      this.scheduleNextStep();
    }
  }

  public getCost(itemIndex: number): number {
    const cols = this.renderer.columns;
    const row = Math.floor(itemIndex / cols);
    const col = itemIndex % cols;

    if (row % 2 === 0) {
      return itemIndex + 1;
    } else {
      const rowStart = row * cols;
      const reversedCol = cols - 1 - col;
      return (rowStart + reversedCol) + 1;
    }
  }
}
