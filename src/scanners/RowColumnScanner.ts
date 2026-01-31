import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';

export class RowColumnScanner extends Scanner {
  private level: 'rows' | 'cells' = 'rows';
  private currentRow: number = -1;
  private currentCol: number = -1;
  private totalRows: number = 0;

  public start() {
    this.recalcDimensions();
    super.start();
  }

  private recalcDimensions() {
    const totalItems = this.renderer.getItemsCount();
    this.totalRows = Math.ceil(totalItems / this.renderer.columns);
  }

  protected reset() {
    this.level = 'rows';
    this.currentRow = -1;
    this.currentCol = -1;
    this.renderer.setFocus([]);
  }

  protected step() {
    if (this.level === 'rows') {
      this.stepRows();
    } else {
      this.stepCells();
    }
  }

  private stepRows() {
    this.currentRow++;
    if (this.currentRow >= this.totalRows) {
      this.currentRow = 0;
    }
    this.highlightRow(this.currentRow);
  }

  private stepCells() {
    const cols = this.renderer.columns;
    const totalItems = this.renderer.getItemsCount();
    const rowStart = this.currentRow * cols;
    const itemsInRow = Math.min(cols, totalItems - rowStart);

    this.currentCol++;
    if (this.currentCol >= itemsInRow) {
      this.currentCol = 0;
    }

    const index = rowStart + this.currentCol;
    this.renderer.setFocus([index]);
  }

  private highlightRow(row: number) {
    const cols = this.renderer.columns;
    const totalItems = this.renderer.getItemsCount();
    const start = row * cols;
    const end = Math.min(start + cols, totalItems);

    const indices = [];
    for (let i = start; i < end; i++) indices.push(i);
    this.renderer.setFocus(indices);
  }

  public handleAction(action: SwitchAction) {
    if (action === 'select') {
      if (this.level === 'rows') {
        if (this.currentRow >= 0) {
          this.level = 'cells';
          this.currentCol = -1;
          this.renderer.setSelected(this.currentRow * this.renderer.columns); // Visual feedback on row?
          // Reset timer to start scanning cells immediately or after delay
          if (this.timer) clearTimeout(this.timer);
          this.scheduleNextStep();
        }
      } else {
        // Select Item
        const index = this.currentRow * this.renderer.columns + this.currentCol;
        const item = this.renderer.getItem(index);
        if (item) {
          this.renderer.setSelected(index);
          this.triggerSelection(item);
          this.reset();
          if (this.timer) clearTimeout(this.timer);
          this.scheduleNextStep();
        }
      }
    } else if (action === 'cancel') { // Or Back
      if (this.level === 'cells') {
        this.level = 'rows';
        this.currentCol = -1;
        this.highlightRow(this.currentRow);
        // Restart timer
        if (this.timer) clearTimeout(this.timer);
        this.scheduleNextStep();
      } else {
        // Cancel scan?
        this.reset();
      }
    }
  }
}
