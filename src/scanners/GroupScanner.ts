import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';

export class GroupScanner extends Scanner {
  private level: 'group' | 'row' | 'cell' = 'group';
  private currentGroup: number = -1;
  private currentRow: number = -1; // relative to group
  private currentCol: number = -1;

  private groups: { rowStart: number, rowEnd: number }[] = [];

  public start() {
    this.calcGroups();
    super.start();
  }

  private calcGroups() {
    const totalItems = this.renderer.getItemsCount();
    const cols = this.renderer.columns;
    const totalRows = Math.ceil(totalItems / cols);

    // Divide into 3 groups if possible
    const groupSize = Math.ceil(totalRows / 3);

    this.groups = [];
    for (let i = 0; i < totalRows; i += groupSize) {
        this.groups.push({
            rowStart: i,
            rowEnd: Math.min(i + groupSize, totalRows)
        });
    }
  }

  protected reset() {
    this.level = 'group';
    this.currentGroup = -1;
    this.currentRow = -1;
    this.currentCol = -1;
    this.renderer.setFocus([]);
  }

  protected step() {
    if (this.level === 'group') this.stepGroup();
    else if (this.level === 'row') this.stepRow();
    else this.stepCell();
  }

  private stepGroup() {
    this.currentGroup++;
    if (this.currentGroup >= this.groups.length) this.currentGroup = 0;
    this.highlightGroup(this.currentGroup);
  }

  private stepRow() {
    const g = this.groups[this.currentGroup];
    const rowsInGroup = g.rowEnd - g.rowStart;
    this.currentRow++;
    if (this.currentRow >= rowsInGroup) this.currentRow = 0;

    const actualRow = g.rowStart + this.currentRow;
    this.highlightRow(actualRow);
  }

  private stepCell() {
     const cols = this.renderer.columns;
     this.currentCol++;
     if (this.currentCol >= cols) this.currentCol = 0;

     const g = this.groups[this.currentGroup];
     const actualRow = g.rowStart + this.currentRow;
     const idx = actualRow * cols + this.currentCol;

     if (this.renderer.getItem(idx)) {
         this.renderer.setFocus([idx]);
     } else {
         // Skip (careful with recursion/loops)
         if (this.currentCol < cols - 1) this.stepCell();
     }
  }

  private highlightGroup(gIndex: number) {
    const g = this.groups[gIndex];
    const indices: number[] = [];
    const cols = this.renderer.columns;
    const totalItems = this.renderer.getItemsCount();

    for (let r = g.rowStart; r < g.rowEnd; r++) {
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            if (idx < totalItems) indices.push(idx);
        }
    }
    this.renderer.setFocus(indices);
  }

  private highlightRow(row: number) {
      const cols = this.renderer.columns;
      const totalItems = this.renderer.getItemsCount();
      const indices: number[] = [];
      for (let c = 0; c < cols; c++) {
          const idx = row * cols + c;
          if (idx < totalItems) indices.push(idx);
      }
      this.renderer.setFocus(indices);
  }

  public handleAction(action: SwitchAction) {
    if (action === 'select') {
       if (this.level === 'group') {
           if (this.currentGroup >= 0) {
               this.level = 'row';
               this.currentRow = -1;
               this.restartTimer();
           }
       } else if (this.level === 'row') {
           if (this.currentRow >= 0) {
               this.level = 'cell';
               this.currentCol = -1;
               this.restartTimer();
           }
       } else {
           const g = this.groups[this.currentGroup];
           const idx = (g.rowStart + this.currentRow) * this.renderer.columns + this.currentCol;
           const item = this.renderer.getItem(idx);
           if (item) {
               this.triggerSelection(item);
               this.reset();
               this.restartTimer();
           }
       }
    } else if (action === 'cancel') {
        if (this.level === 'cell') {
            this.level = 'row';
            this.currentCol = -1;
            this.restartTimer();
        } else if (this.level === 'row') {
            this.level = 'group';
            this.currentRow = -1;
            this.restartTimer();
        } else {
            this.reset();
        }
    }
  }

  private restartTimer() {
      if (this.timer) clearTimeout(this.timer);
      this.scheduleNextStep();
  }
}
