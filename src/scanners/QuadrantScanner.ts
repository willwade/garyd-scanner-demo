import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';
import { GridItem } from '../GridRenderer';

export class QuadrantScanner extends Scanner {
  private level: 'quadrant' | 'row' | 'cell' = 'quadrant';
  private currentQuad: number = -1; // 0..3
  private currentRow: number = -1; // relative to quad
  private currentCol: number = -1; // relative to row

  // Quadrant bounds (calculated at start)
  private quads: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }[] = [];

  public start() {
    this.calcQuadrants();
    super.start();
  }

  private calcQuadrants() {
    const totalItems = this.renderer.getItemsCount();
    const cols = this.renderer.columns;
    const totalRows = Math.ceil(totalItems / cols);

    const midRow = Math.ceil(totalRows / 2);
    const midCol = Math.ceil(cols / 2);

    this.quads = [
      { rowStart: 0, rowEnd: midRow, colStart: 0, colEnd: midCol }, // TL
      { rowStart: 0, rowEnd: midRow, colStart: midCol, colEnd: cols }, // TR
      { rowStart: midRow, rowEnd: totalRows, colStart: 0, colEnd: midCol }, // BL
      { rowStart: midRow, rowEnd: totalRows, colStart: midCol, colEnd: cols } // BR
    ];
  }

  protected reset() {
    this.level = 'quadrant';
    this.currentQuad = -1;
    this.currentRow = -1;
    this.currentCol = -1;
    this.renderer.setFocus([]);
  }

  protected step() {
    if (this.level === 'quadrant') {
      this.stepQuadrant();
    } else if (this.level === 'row') {
      this.stepRow();
    } else {
      this.stepCell();
    }
  }

  private stepQuadrant() {
    this.currentQuad++;
    if (this.currentQuad >= 4) this.currentQuad = 0;
    this.highlightQuad(this.currentQuad);
  }

  private stepRow() {
    const q = this.quads[this.currentQuad];
    const rowsInQuad = q.rowEnd - q.rowStart;

    this.currentRow++;
    if (this.currentRow >= rowsInQuad) this.currentRow = 0;

    // Highlight Row within Quad
    const actualRow = q.rowStart + this.currentRow;
    this.highlightRowSegment(actualRow, q.colStart, q.colEnd);
  }

  private stepCell() {
    const q = this.quads[this.currentQuad];
    const colsInQuad = q.colEnd - q.colStart;

    this.currentCol++;
    if (this.currentCol >= colsInQuad) this.currentCol = 0;

    const actualRow = q.rowStart + this.currentRow;
    const actualCol = q.colStart + this.currentCol;
    const index = actualRow * this.renderer.columns + actualCol;

    if (this.renderer.getItem(index)) {
       this.renderer.setFocus([index]);
    } else {
       // Skip empty
       this.stepCell(); // Recursive risk?
    }
  }

  private highlightQuad(qIndex: number) {
    const q = this.quads[qIndex];
    const indices: number[] = [];
    const cols = this.renderer.columns;
    const totalItems = this.renderer.getItemsCount();

    for (let r = q.rowStart; r < q.rowEnd; r++) {
      for (let c = q.colStart; c < q.colEnd; c++) {
        const idx = r * cols + c;
        if (idx < totalItems) indices.push(idx);
      }
    }
    this.renderer.setFocus(indices);
  }

  private highlightRowSegment(row: number, colStart: number, colEnd: number) {
    const indices: number[] = [];
    const cols = this.renderer.columns;
    const totalItems = this.renderer.getItemsCount();

    for (let c = colStart; c < colEnd; c++) {
        const idx = row * cols + c;
        if (idx < totalItems) indices.push(idx);
    }
    this.renderer.setFocus(indices);
  }

  public handleAction(action: SwitchAction) {
    if (action === 'select') {
      if (this.level === 'quadrant') {
        if (this.currentQuad >= 0) {
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
        // Select Item
        const q = this.quads[this.currentQuad];
        const idx = (q.rowStart + this.currentRow) * this.renderer.columns + (q.colStart + this.currentCol);
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
            this.level = 'quadrant';
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

  public getCost(itemIndex: number): number {
    const cols = this.renderer.columns;
    const totalItems = this.renderer.getItemsCount();
    const totalRows = Math.ceil(totalItems / cols);
    const midRow = Math.ceil(totalRows / 2);
    const midCol = Math.ceil(cols / 2);

    const row = Math.floor(itemIndex / cols);
    const col = itemIndex % cols;

    let quadIndex = 0;
    if (row < midRow) {
      // Top
      if (col < midCol) quadIndex = 0; // TL
      else quadIndex = 1; // TR
    } else {
      // Bottom
      if (col < midCol) quadIndex = 2; // BL
      else quadIndex = 3; // BR
    }

    let rowInQuad = row;
    if (row >= midRow) rowInQuad = row - midRow;

    let colInQuad = col;
    if (col >= midCol) colInQuad = col - midCol;

    // Cost = Quad selection + Row selection + Cell selection
    return (quadIndex + 1) + (rowInQuad + 1) + (colInQuad + 1);
  }

  public mapContentToGrid(content: GridItem[], rows: number, cols: number): GridItem[] {
      // Quadrant scanning typically works on a standard grid (A-Z).
      // However, if we want "A" to be the first item selected...
      // Quad 0 scans first. It contains (0,0) to (midRow, midCol).
      // If we use standard Row-Major layout, A is at (0,0), B at (0,1)...
      // Quad 0 will contain A, B, C, D...
      // So Quadrant scanning naturally "follows" the content if the content is placed top-left to bottom-right.
      //
      // Example 4x4 grid. Mid=2,2.
      // Quad 0: (0,0) (0,1) (1,0) (1,1). Indices: 0, 1, 4, 5.
      // If content is A..P.
      // A(0), B(1), E(4), F(5) are in Quad 0.
      // C(2), D(3), G(6), H(7) are in Quad 1.
      //
      // Scan order: Quad 0 -> Quad 1 -> Quad 2 -> Quad 3.
      // If user wants "Alphabetical order to follow it", they probably want:
      // Quad 0 contains A, B, C, D.
      // Quad 1 contains E, F, G, H.
      //
      // So we need to fill Quad 0 completely, then Quad 1...

      const newContent = new Array(content.length);
      let contentIdx = 0;

      const midRow = Math.ceil(rows / 2);
      const midCol = Math.ceil(cols / 2);

      const quads = [
          { rS: 0, rE: midRow, cS: 0, cE: midCol }, // TL
          { rS: 0, rE: midRow, cS: midCol, cE: cols }, // TR
          { rS: midRow, rE: rows, cS: 0, cE: midCol }, // BL
          { rS: midRow, rE: rows, cS: midCol, cE: cols } // BR
      ];

      for (const q of quads) {
          for (let r = q.rS; r < q.rE; r++) {
              for (let c = q.cS; c < q.cE; c++) {
                  if (contentIdx >= content.length) break;

                  // Fill row-major WITHIN the quadrant
                  const gridIndex = r * cols + c;
                  if (gridIndex < newContent.length) {
                      newContent[gridIndex] = content[contentIdx++];
                  }
              }
          }
      }

      return newContent;
  }
}
