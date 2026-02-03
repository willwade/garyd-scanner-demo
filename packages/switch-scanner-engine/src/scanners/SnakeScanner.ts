import { Scanner } from '../Scanner';
import type { SwitchAction } from '../types';

export class SnakeScanner extends Scanner {
  private currentRow: number = 0;
  private currentCol: number = 0;
  private direction: number = 1; // 1 = Right, -1 = Left
  private maxRow: number = 0;
  private maxCol: number = 0;

  public start() {
    // Determine grid dimensions
    this.updateDimensions();
    super.start();
  }

  private updateDimensions() {
    const total = this.surface.getItemsCount();
    this.maxCol = this.surface.getColumns();
    this.maxRow = Math.ceil(total / this.maxCol);
  }

  protected reset() {
    this.currentRow = 0;
    this.currentCol = 0;
    this.direction = 1;
    const cfg = this.config.get();
    this.surface.setFocus([0], {
      phase: 'item',
      scanRate: cfg.scanRate,
      scanPattern: cfg.scanPattern,
      scanTechnique: cfg.scanTechnique,
      scanDirection: cfg.scanDirection,
    });
  }

  protected step() {
    // Calculate next position based on snake pattern
    this.currentCol += this.direction;

    // Check boundaries
    if (this.currentCol >= this.maxCol) {
      this.currentCol = this.maxCol - 1;
      this.currentRow++;
      this.direction = -1;
    } else if (this.currentCol < 0) {
      this.currentCol = 0;
      this.currentRow++;
      this.direction = 1;
    }

    if (this.currentRow >= this.maxRow) {
      this.currentRow = 0;
      this.currentCol = 0;
      this.direction = 1;
    }

    // Convert row/col to index
    const index = this.currentRow * this.maxCol + this.currentCol;

    // Check if index is valid (last row might be incomplete)
    // If invalid, skip to start
    if (index >= this.surface.getItemsCount()) {
        this.reset();
        return;
    }

    const cfg = this.config.get();
    this.surface.setFocus([index], {
      phase: 'item',
      scanRate: cfg.scanRate,
      scanPattern: cfg.scanPattern,
      scanTechnique: cfg.scanTechnique,
      scanDirection: cfg.scanDirection,
    });
  }

  public handleAction(action: SwitchAction) {
    if (action !== 'select') {
      super.handleAction(action);
    } else {
      // Let base class handle select with critical overscan logic
      super.handleAction(action);
    }
  }

  protected doSelection() {
    const index = this.currentRow * this.maxCol + this.currentCol;
    if (index >= 0) {
      this.triggerSelection(index);
      this.reset();
      if (this.timer) clearTimeout(this.timer);
      this.scheduleNextStep();
    }
  }

  public getCost(itemIndex: number): number {
    // TODO: Calculate snake distance
    return itemIndex; // approx
  }

  public mapContentToGrid<T>(content: T[], rows: number, cols: number): T[] {
      // Create a new array of same length
      const newContent = new Array(content.length);

      // Simulate the snake path
      let r = 0, c = 0, dir = 1;

      // We need to fill the grid such that the scanner path (0->1->2 -> 5->4->3)
      // encounters content[0], content[1], content[2], content[3]...

      // The grid is stored in Row-Major order (0,1,2, 3,4,5).
      // We want grid[path[i]] = content[i].

      for (let i = 0; i < content.length; i++) {
           // Calculate current grid index (row-major)
           const gridIndex = r * cols + c;

           if (gridIndex < newContent.length) {
                // Place current content item at this grid position
                newContent[gridIndex] = content[i];
           }

           // Advance snake
           c += dir;
           if (c >= cols) {
               c = cols - 1;
               r++;
               dir = -1;
           } else if (c < 0) {
               c = 0;
               r++;
               dir = 1;
           }
           if (r >= rows) break;
      }

      // Fill any holes (if content length != grid size, though normally we generate exact or have empties)
      // If content was shorter than grid, some slots are undefined.
      // Copy over any remaining if needed or leave undefined/empty.
      return newContent;
  }
}
