import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';
import { GridItem } from '../GridRenderer';

export class RowColumnScanner extends Scanner {
  private level: 'rows' | 'cells' = 'rows';
  private currentRow: number = -1;
  private currentCol: number = -1;
  private totalRows: number = 0;
  private isColumnRow: boolean = false;

  public start() {
    this.isColumnRow = this.config.get().scanStrategy === 'column-row';
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
    this.level = 'rows'; // "Major Group"
    this.currentRow = -1; // "Major Index"
    this.currentCol = -1; // "Minor Index"
    this.renderer.setFocus([]);
  }

  protected step() {
    if (this.level === 'rows') {
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

    if (this.isColumnRow) {
         // Major is Column (this.currentRow is col index)
         // Minor is Row (this.currentCol is row index)
         // How many rows in this column?
         // If full grid, it is 'rows'.
         // If partial last row, we need to check.
         const colIdx = this.currentRow;
         // Last row has items only up to totalItems % cols
         // If totalItems % cols == 0, full.
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

    // Calculate actual index
    let index = -1;
    if (this.isColumnRow) {
        // Col-Row: index = row * cols + col
        // Major = col, Minor = row
        index = this.currentCol * cols + this.currentRow;
    } else {
        index = this.currentRow * cols + this.currentCol;
    }

    this.renderer.setFocus([index]);
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
    if (action === 'select') {
      if (this.level === 'rows') {
        if (this.currentRow >= 0) {
          this.level = 'cells';
          this.currentCol = -1;
          this.renderer.setSelected(-1); // Just flash?
          if (this.timer) clearTimeout(this.timer);
          this.scheduleNextStep();
        }
      } else {
        // Select Item
        let index = 0;
        const cols = this.renderer.columns;
        if (this.isColumnRow) {
             index = this.currentCol * cols + this.currentRow;
        } else {
             index = this.currentRow * cols + this.currentCol;
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
    } else if (action === 'cancel') {
      if (this.level === 'cells') {
        this.level = 'rows';
        this.currentCol = -1;
        this.highlightMajor(this.currentRow);
        if (this.timer) clearTimeout(this.timer);
        this.scheduleNextStep();
      } else {
        this.reset();
      }
    }
  }

  public getCost(itemIndex: number): number {
    const cols = this.renderer.columns;
    const row = Math.floor(itemIndex / cols);
    const col = itemIndex % cols;
    if (this.isColumnRow) {
        return (col + 1) + (row + 1);
    }
    return (row + 1) + (col + 1);
  }

  public mapContentToGrid(content: GridItem[], rows: number, cols: number): GridItem[] {
      // If Row-Column, default identity mapping is correct (A, B, C fills row).
      if (this.config.get().scanStrategy !== 'column-row') {
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
