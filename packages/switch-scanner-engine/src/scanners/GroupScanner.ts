import { Scanner } from '../Scanner';
import type { SwitchAction } from '../types';

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
    const totalItems = this.surface.getItemsCount();
    const cols = this.surface.getColumns();
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
    this.surface.setFocus([]);
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
     const cols = this.surface.getColumns();
     this.currentCol++;
     if (this.currentCol >= cols) this.currentCol = 0;

     const g = this.groups[this.currentGroup];
     const actualRow = g.rowStart + this.currentRow;
     const idx = actualRow * cols + this.currentCol;

     if (idx < this.surface.getItemsCount()) {
         const cfg = this.config.get();
         this.surface.setFocus([idx], {
           phase: 'item',
           scanRate: cfg.scanRate,
           scanPattern: cfg.scanPattern,
           scanTechnique: cfg.scanTechnique,
           scanDirection: cfg.scanDirection,
         });
     } else {
         // Skip (careful with recursion/loops)
         if (this.currentCol < cols - 1) this.stepCell();
     }
  }

  private highlightGroup(gIndex: number) {
    const g = this.groups[gIndex];
    const indices: number[] = [];
    const cols = this.surface.getColumns();
    const totalItems = this.surface.getItemsCount();

    for (let r = g.rowStart; r < g.rowEnd; r++) {
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            if (idx < totalItems) indices.push(idx);
        }
    }
    const cfg = this.config.get();
    this.surface.setFocus(indices, {
      phase: 'major',
      scanRate: cfg.scanRate,
      scanPattern: cfg.scanPattern,
      scanTechnique: cfg.scanTechnique,
      scanDirection: cfg.scanDirection,
    });
  }

  private highlightRow(row: number) {
      const cols = this.surface.getColumns();
      const totalItems = this.surface.getItemsCount();
      const indices: number[] = [];
      for (let c = 0; c < cols; c++) {
          const idx = row * cols + c;
          if (idx < totalItems) indices.push(idx);
      }
      const cfg = this.config.get();
      this.surface.setFocus(indices, {
        phase: 'minor',
        scanRate: cfg.scanRate,
        scanPattern: cfg.scanPattern,
        scanTechnique: cfg.scanTechnique,
        scanDirection: cfg.scanDirection,
      });
  }

  public handleAction(action: SwitchAction) {
    if (action === 'cancel') {
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
    } else {
      // Let base class handle select, reset, step, etc.
      super.handleAction(action);
    }
  }

  protected doSelection() {
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
      const idx = (g.rowStart + this.currentRow) * this.surface.getColumns() + this.currentCol;
      if (idx >= 0) {
        this.triggerSelection(idx);
        this.reset();
        this.restartTimer();
      }
    }
  }

  private restartTimer() {
      if (this.timer) clearTimeout(this.timer);
      this.scheduleNextStep();
  }

  public getCost(itemIndex: number): number {
    const cols = this.surface.getColumns();
    const totalItems = this.surface.getItemsCount();
    const totalRows = Math.ceil(totalItems / cols);
    const groupSize = Math.ceil(totalRows / 3);

    const row = Math.floor(itemIndex / cols);
    const col = itemIndex % cols;

    const groupIndex = Math.floor(row / groupSize);
    const rowIndexInGroup = row % groupSize;

    return (groupIndex + 1) + (rowIndexInGroup + 1) + (col + 1);
  }
}
