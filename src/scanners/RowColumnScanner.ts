import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';
import { GridItem } from '../GridRenderer';

export class RowColumnScanner extends Scanner {
  private level: 'rows' | 'cells' = 'rows';
  private currentRow: number = -1;
  private currentCol: number = -1;
  private totalRows: number = 0;
  private isColumnRow: boolean = false;
  private useBlockScanning: boolean = true;

  public start() {
    const config = this.config.get();
    this.isColumnRow = config.scanPattern === 'column-row';
    this.useBlockScanning = config.scanTechnique === 'block';
    this.recalcDimensions();
    super.start();
  }

  private recalcDimensions() {
    const totalItems = this.renderer.getItemsCount();
    if (this.isColumnRow) {
         // In Column-Row, primary groups are columns.
         // But GridRenderer is always Row-Major layout.
         // So "Rows" in scanner logic might mean "Columns" visually?
         // Let's implement distinct logic for clarity.
         this.totalRows = this.renderer.columns;
    } else {
         this.totalRows = Math.ceil(totalItems / this.renderer.columns);
    }
  }

  protected reset() {
    // For point scanning, skip the row/column group level
    this.level = this.useBlockScanning ? 'rows' : 'cells';
    this.currentRow = -1;
    this.currentCol = -1;
    this.renderer.setFocus([]);
  }

  protected step() {
    if (this.useBlockScanning && this.level === 'rows') {
      this.stepMajor();
    } else {
      this.stepMinor();
    }
  }

  private stepMajor() {
    this.currentRow++;
    if (this.currentRow >= this.totalRows) {
      this.currentRow = 0;
    }
    this.highlightMajor(this.currentRow);
  }

  private stepMinor() {
    // Determine bounds for minor step
    let maxMinor = 0;
    const totalItems = this.renderer.getItemsCount();
    const cols = this.renderer.columns;
    const rows = Math.ceil(totalItems / cols);

    if (this.useBlockScanning) {
      // Block scanning: scan within the selected row/column
      if (this.isColumnRow) {
        // Major is Column (this.currentRow is col index)
        // Minor is Row (this.currentCol is row index)
        // How many rows in this column?
        const colIdx = this.currentRow;
        const lastRowLength = totalItems % cols || cols;

        if (colIdx < lastRowLength) {
          maxMinor = rows;
        } else {
          maxMinor = rows - 1;
        }
      } else {
        // Major is Row
        // Minor is Column
        const rowStart = this.currentRow * cols;
        maxMinor = Math.min(cols, totalItems - rowStart);
      }

      this.currentCol++;
      if (this.currentCol >= maxMinor) {
        this.currentCol = 0;
      }
    } else {
      // Point scanning: scan through all items in row/column order
      this.currentCol++;
      if (this.currentCol >= totalItems) {
        this.currentCol = 0;
      }
    }

    // Calculate actual index
    let index = -1;
    if (this.useBlockScanning) {
      if (this.isColumnRow) {
        index = this.currentCol * cols + this.currentRow;
      } else {
        index = this.currentRow * cols + this.currentCol;
      }
    } else {
      // Point scanning: iterate in row-major or column-major order
      if (this.isColumnRow) {
        // Column-major order
        const row = Math.floor(this.currentCol / cols);
        const col = this.currentCol % cols;
        index = row * cols + col;
      } else {
        // Row-major order (simple linear)
        index = this.currentCol;
      }
    }

    if (index >= 0 && index < totalItems) {
      this.renderer.setFocus([index]);
    }
  }

  private highlightMajor(majorIndex: number) {
    const cols = this.renderer.columns;
    const totalItems = this.renderer.getItemsCount();
    const indices = [];

    if (this.isColumnRow) {
        // Highlight Column
        // Grid is Row-Major. Col 0 is indices 0, 8, 16...
        const rows = Math.ceil(totalItems / cols);
        for (let r = 0; r < rows; r++) {
            const idx = r * cols + majorIndex;
            if (idx < totalItems) indices.push(idx);
        }
    } else {
        // Highlight Row
        const start = majorIndex * cols;
        const end = Math.min(start + cols, totalItems);
        for (let i = start; i < end; i++) indices.push(i);
    }

    this.renderer.setFocus(indices);
  }

  public handleAction(action: SwitchAction) {
    if (action === 'cancel') {
      if (this.useBlockScanning && this.level === 'cells') {
        this.level = 'rows';
        this.currentCol = -1;
        this.highlightMajor(this.currentRow);
        if (this.timer) clearTimeout(this.timer);
        this.scheduleNextStep();
      } else {
        this.reset();
      }
    } else {
      // Let base class handle select, reset, step, etc.
      super.handleAction(action);
    }
  }

  protected doSelection() {
    if (this.useBlockScanning && this.level === 'rows') {
      if (this.currentRow >= 0) {
        this.level = 'cells';
        this.currentCol = -1;
        this.renderer.setSelected(-1);
        if (this.timer) clearTimeout(this.timer);
        this.scheduleNextStep();
      }
    } else {
      // Select Item (either point scanning or second level of block scanning)
      let index = -1;
      const cols = this.renderer.columns;

      if (this.useBlockScanning) {
        if (this.isColumnRow) {
          index = this.currentCol * cols + this.currentRow;
        } else {
          index = this.currentRow * cols + this.currentCol;
        }
      } else {
        // Point scanning
        if (this.isColumnRow) {
          const row = Math.floor(this.currentCol / cols);
          const col = this.currentCol % cols;
          index = row * cols + col;
        } else {
          index = this.currentCol;
        }
      }

      const item = this.renderer.getItem(index);
      if (item) {
        this.renderer.setSelected(index);
        this.triggerSelection(item);
        this.reset();
        if (this.timer) clearTimeout(this.timer);
        this.scheduleNextStep();
      }
    }
  }

  public getCost(itemIndex: number): number {
    const cols = this.renderer.columns;
    const row = Math.floor(itemIndex / cols);
    const col = itemIndex % cols;

    if (this.useBlockScanning) {
      // Block scanning: cost = row/col + item within row/col
      if (this.isColumnRow) {
        return (col + 1) + (row + 1);
      }
      return (row + 1) + (col + 1);
    } else {
      // Point scanning: simple linear cost
      if (this.isColumnRow) {
        // Column-major order cost
        return col + 1 + row + 1;
      }
      return itemIndex + 1;
    }
  }

  public mapContentToGrid(content: GridItem[], rows: number, cols: number): GridItem[] {
      // If Row-Column, default identity mapping is correct (A, B, C fills row).
      if (this.config.get().scanPattern !== 'column-row') {
          return content;
      }

      // If Column-Row, we want A, B, C to fill the first COLUMN.
      // Grid is Row-Major (0=0,0; 1=0,1).
      // We want Content[0] ('A') at Grid[0] (0,0).
      // Content[1] ('B') at Grid[cols] (1,0).

      const newContent = new Array(content.length);
      let contentIdx = 0;

      // Iterate columns, then rows
      for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
              if (contentIdx >= content.length) break;

              const gridIndex = r * cols + c;
              if (gridIndex < newContent.length) {
                  newContent[gridIndex] = content[contentIdx++];
              }
          }
      }
      return newContent;
  }
}
