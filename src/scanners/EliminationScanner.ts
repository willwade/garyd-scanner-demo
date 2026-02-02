import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';

// Color mapping for switches
const SWITCH_COLORS: Record<string, string> = {
  'switch-1': '#2196F3', // Blue
  'switch-2': '#F44336', // Red
  'switch-3': '#4CAF50', // Green
  'switch-4': '#FFEB3B', // Yellow
  'switch-5': '#9C27B0', // Purple
  'switch-6': '#FF9800', // Orange
  'switch-7': '#00BCD4', // Cyan
  'switch-8': '#E91E63'  // Magenta
};

export class EliminationScanner extends Scanner {
  private rangeStart: number = 0;
  private rangeEnd: number = 0; // Exclusive
  private currentBlock: number = 0; // Which block is currently highlighted
  private numSwitches: number = 4; // Default to 4-switch (quadrant)
  private partitionHistory: Array<{start: number; end: number}> = [];

  public start() {
    const config = this.config.get();
    this.numSwitches = config.eliminationSwitchCount || 4;
    this.rangeStart = 0;
    this.rangeEnd = this.renderer.getItemsCount();
    this.partitionHistory = [];
    super.start();
  }

  protected reset() {
    this.rangeStart = 0;
    this.rangeEnd = this.renderer.getItemsCount();
    this.currentBlock = 0;
    this.partitionHistory = [];
    this.clearHighlights();
  }

  private clearHighlights() {
    this.renderer.setFocus([]);
    // Clear any color highlights
    const container = this.renderer.getContainer();
    const cells = container.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
      (cell as HTMLElement).style.backgroundColor = '';
      (cell as HTMLElement).style.boxShadow = '';
    });
  }

  protected step() {
    // Cycle through blocks
    this.currentBlock = (this.currentBlock + 1) % this.numSwitches;
    this.highlightCurrentBlock();
  }

  private highlightCurrentBlock() {
    this.clearHighlights();

    const partitions = this.calculatePartitions(this.rangeStart, this.rangeEnd, this.numSwitches);
    const partition = partitions[this.currentBlock];

    if (!partition) return;

    // Highlight cells with color and border
    const container = this.renderer.getContainer();
    for (let i = partition.start; i < partition.end; i++) {
      const cell = container.querySelector(`[data-index="${i}"]`) as HTMLElement;
      if (cell) {
        const switchAction = this.getSwitchAction(this.currentBlock);
        const color = SWITCH_COLORS[switchAction];

        // Apply colored background
        cell.style.backgroundColor = color;
        cell.style.opacity = '0.4';

        // Add colored border
        cell.style.boxShadow = `inset 0 0 0 3px ${color}`;
        cell.style.border = `2px solid ${color}`;
      }
    }
  }

  private calculatePartitions(start: number, end: number, n: number): Array<{start: number; end: number}> {
    const partitions: Array<{start: number; end: number}> = [];
    const total = end - start;
    const baseSize = Math.floor(total / n);
    const remainder = total % n;

    let currentStart = start;
    for (let i = 0; i < n; i++) {
      // Add 1 to the first 'remainder' partitions to distribute extras
      const size = baseSize + (i < remainder ? 1 : 0);
      partitions.push({ start: currentStart, end: currentStart + size });
      currentStart += size;
    }

    return partitions;
  }

  private getSwitchAction(blockIndex: number): SwitchAction {
    const switchMap: Record<number, SwitchAction> = {
      0: 'switch-1',
      1: 'switch-2',
      2: 'switch-3',
      3: 'switch-4',
      4: 'switch-5',
      5: 'switch-6',
      6: 'switch-7',
      7: 'switch-8'
    };
    return switchMap[blockIndex] || 'switch-1';
  }

  public handleAction(action: SwitchAction) {
    if (action === 'select') {
      // Handle select action for critical overscan support
      this.doSelection();
      return;
    }

    // Check if it's a switch action (switch-1 through switch-8)
    // Check if it's a switch action (switch-1 through switch-8)
    if (action.toString().startsWith('switch-')) {
      const switchNum = parseInt(action.toString().split('-')[1]) - 1;

      if (switchNum >= this.numSwitches) {
        // Ignore switches beyond our count
        return;
      }

      const rangeSize = this.rangeEnd - this.rangeStart;

      if (rangeSize <= 1) {
        // Already at single item - select it
        const item = this.renderer.getItem(this.rangeStart);
        if (item) {
          this.triggerSelection(item);
          this.reset();
          this.restartTimer();
        }
        return;
      }

      // Check if this is the correct block for current round
      if (switchNum === this.currentBlock) {
        // Select this block and drill down
        const partitions = this.calculatePartitions(this.rangeStart, this.rangeEnd, this.numSwitches);
        const selectedBlock = partitions[switchNum];

        if (selectedBlock) {
          // Save history for potential undo
          this.partitionHistory.push({ start: this.rangeStart, end: this.rangeEnd });

          // Narrow to selected block
          this.rangeStart = selectedBlock.start;
          this.rangeEnd = selectedBlock.end;

          // Reset to first block for new range
          this.currentBlock = 0;

          // If only one item left, highlight it immediately
          if (this.rangeEnd - this.rangeStart === 1) {
            this.clearHighlights();
            const cell = this.renderer.getContainer().querySelector(`[data-index="${this.rangeStart}"]`) as HTMLElement;
            if (cell) {
              const color = SWITCH_COLORS['switch-1'];
              cell.style.backgroundColor = color;
              cell.style.opacity = '0.6';
              cell.style.boxShadow = `inset 0 0 0 4px ${color}, 0 0 10px ${color}`;
            }
          }
        }

        this.restartTimer();
      }
      return;
    }

    // Handle other actions
    if (action === 'cancel' || action === 'reset') {
      // Go back up one level if possible, otherwise reset
      if (this.partitionHistory.length > 0) {
        const previous = this.partitionHistory.pop()!;
        this.rangeStart = previous.start;
        this.rangeEnd = previous.end;
        this.currentBlock = 0;
      } else {
        this.reset();
      }
      this.restartTimer();
    }
  }

  protected doSelection() {
    // Elimination scanner uses switch-N actions, not standard select
    // This is provided for critical overscan compatibility
    // If we're down to a single item, select it
    const rangeSize = this.rangeEnd - this.rangeStart;
    if (rangeSize <= 1) {
      const item = this.renderer.getItem(this.rangeStart);
      if (item) {
        this.triggerSelection(item);
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
    const n = this.numSwitches;
    let start = 0;
    let end = this.renderer.getItemsCount();
    let cost = 0;

    // Simulate n-way elimination
    while (end - start > 1) {
      const partitions = this.calculatePartitions(start, end, n);

      // Find which partition contains the item
      let foundPartition = 0;
      for (let i = 0; i < partitions.length; i++) {
        if (itemIndex >= partitions[i].start && itemIndex < partitions[i].end) {
          foundPartition = i;
          break;
        }
      }

      // Need to cycle through all partitions to reach the right one
      cost += (foundPartition + 1);

      start = partitions[foundPartition].start;
      end = partitions[foundPartition].end;
    }

    return cost;
  }

  // Override to disable step scheduling - elimination waits for specific switch input
  protected scheduleNextStep() {
    if (!this.isRunning) return;

    // Don't auto-schedule steps in manual mode
    if (this.config.get().scanInputMode === 'manual') {
      return;
    }

    if (this.timer) clearTimeout(this.timer);

    const rate = this.config.get().scanRate;
    this.timer = window.setTimeout(() => {
      this.step();
      this.scheduleNextStep();
    }, rate);
  }
}
