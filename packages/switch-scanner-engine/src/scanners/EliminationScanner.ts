import { Scanner } from '../Scanner';
import type { SwitchAction } from '../types';

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
    this.rangeEnd = this.surface.getItemsCount();
    this.partitionHistory = [];
    super.start();

    // In manual mode there is no timer-driven stepping, so render an initial state.
    if (config.scanInputMode === 'manual') {
      this.highlightAllBlocksManual();
    }
  }

  protected reset() {
    this.rangeStart = 0;
    this.rangeEnd = this.surface.getItemsCount();
    this.currentBlock = 0;
    this.partitionHistory = [];
    this.clearHighlights();
  }

  private clearHighlights() {
    this.surface.setFocus([]);
    if (this.surface.clearItemStyles) {
      this.surface.clearItemStyles();
    }
  }

  private highlightAllBlocksManual() {
    this.clearHighlights();

    const partitions = this.calculatePartitions(this.rangeStart, this.rangeEnd, this.numSwitches);
    for (let block = 0; block < partitions.length; block++) {
      const partition = partitions[block];
      if (!partition || partition.start >= partition.end) continue;

      const switchAction = this.getSwitchAction(block);
      const color = SWITCH_COLORS[switchAction];

      for (let i = partition.start; i < partition.end; i++) {
        this.surface.setItemStyle?.(i, {
          backgroundColor: color,
          opacity: 0.35,
          borderColor: color,
          borderWidth: 2,
          boxShadow: `inset 0 0 0 2px ${color}`
        });
      }
    }
  }

  protected step() {
    // Cycle through blocks
    this.currentBlock = (this.currentBlock + 1) % this.numSwitches;
    this.highlightCurrentBlock();
  }

  private highlightCurrentBlock() {
    if (this.config.get().scanInputMode === 'manual') {
      this.highlightAllBlocksManual();
      return;
    }

    this.clearHighlights();

    const partitions = this.calculatePartitions(this.rangeStart, this.rangeEnd, this.numSwitches);
    const partition = partitions[this.currentBlock];

    if (!partition) return;

    // Highlight cells with color and border
    for (let i = partition.start; i < partition.end; i++) {
      const switchAction = this.getSwitchAction(this.currentBlock);
      const color = SWITCH_COLORS[switchAction];

      this.surface.setItemStyle?.(i, {
        backgroundColor: color,
        opacity: 0.4,
        borderColor: color,
        borderWidth: 2,
        boxShadow: `inset 0 0 0 3px ${color}`
      });
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
      const isManualMode = this.config.get().scanInputMode === 'manual';

      if (switchNum >= this.numSwitches) {
        // Ignore switches beyond our count
        return;
      }

      const rangeSize = this.rangeEnd - this.rangeStart;

      if (rangeSize <= 1) {
        // Already at single item - select it
        if (this.rangeStart >= 0) {
          this.triggerSelection(this.rangeStart);
          this.reset();
          this.restartTimer();
        }
        return;
      }

      // In manual mode, switch-N directly selects partition N.
      // In auto mode, user must match the currently highlighted block.
      if (isManualMode || switchNum === this.currentBlock) {
        if (isManualMode) {
          this.currentBlock = switchNum;
        }

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
            const color = SWITCH_COLORS['switch-1'];
            this.surface.setItemStyle?.(this.rangeStart, {
              backgroundColor: color,
              opacity: 0.6,
              boxShadow: `inset 0 0 0 4px ${color}, 0 0 10px ${color}`,
              borderColor: color,
              borderWidth: 2
            });
          }
        }

        this.restartTimer();
        if (isManualMode && this.rangeEnd - this.rangeStart > 1) {
          this.highlightAllBlocksManual();
        }
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
      if (this.config.get().scanInputMode === 'manual') {
        this.highlightAllBlocksManual();
      }
    }
  }

  protected doSelection() {
    // Elimination scanner uses switch-N actions, not standard select
    // This is provided for critical overscan compatibility
    // If we're down to a single item, select it
    const rangeSize = this.rangeEnd - this.rangeStart;
    if (rangeSize <= 1) {
      if (this.rangeStart >= 0) {
        this.triggerSelection(this.rangeStart);
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
    let end = this.surface.getItemsCount();
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
