import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';

export class LinearScanner extends Scanner {
  private currentIndex: number = -1;
  private totalItems: number = 0;
  private direction: number = 1; // 1 for forward, -1 for reverse

  public start() {
    // Need to know how many items are in the grid
    // For now we assume the renderer has items loaded.
    // In a real scenario, we might query the renderer or pass the items.
    // We can use a trick: try to get items until undefined.
    this.totalItems = this.countItems();
    this.direction = 1; // Reset direction on start
    super.start();
  }

  private countItems(): number {
    let i = 0;
    while (this.renderer.getItem(i)) {
      i++;
    }
    return i;
  }

  protected reset() {
    this.currentIndex = -1;
    this.direction = 1; // Reset direction
    this.renderer.setFocus([]);
  }

  protected step() {
    const config = this.config.get();

    switch (config.scanDirection) {
      case 'circular':
        // Normal circular: 0,1,2,...,n-1,0,1,2,...
        this.currentIndex++;
        if (this.currentIndex >= this.totalItems) {
          this.currentIndex = 0;
        }
        break;

      case 'reverse':
        // Reverse: n-1,n-2,...,0,n-1,n-2,...
        this.currentIndex--;
        if (this.currentIndex < 0) {
          this.currentIndex = this.totalItems - 1;
        }
        break;

      case 'oscillating':
        // Oscillating: 0,1,2,...,n-1,n-2,...,1,0,1,2,...
        this.currentIndex += this.direction;

        // Change direction if we hit an endpoint
        if (this.currentIndex >= this.totalItems - 1) {
          this.direction = -1; // Reached end, next step will go backward
        } else if (this.currentIndex <= 0) {
          this.direction = 1; // Reached start, next step will go forward
        }
        break;
    }

    this.renderer.setFocus([this.currentIndex]);
  }

  public handleAction(action: SwitchAction) {
    if (action === 'select') {
      if (this.currentIndex >= 0) {
        const item = this.renderer.getItem(this.currentIndex);
        if (item) {
          this.renderer.setSelected(this.currentIndex);
          this.triggerSelection(item);
          // Restart scan from 0 or stay? Usually restart.
          this.reset();
          // Reset timer
          if (this.timer) clearTimeout(this.timer);
          this.scheduleNextStep();
        }
      }
    } else if (action === 'step') {
      // Manually step
      if (this.timer) clearTimeout(this.timer); // Pause auto-scan if stepping manually?
      this.step();
      this.audio.playScanSound();
      // Resume auto-scan? Or stay paused? Depends on mode.
      // For now, resume.
      this.scheduleNextStep();
    }
  }

  public getCost(itemIndex: number): number {
    const config = this.config.get();

    switch (config.scanDirection) {
      case 'circular':
        return itemIndex + 1;

      case 'reverse':
        // In reverse mode, cost is (n - index)
        // Item n-1 costs 1, item 0 costs n
        return this.totalItems - itemIndex;

      case 'oscillating':
        // For oscillating, cost is the first time you encounter the item
        // which is always during the forward pass
        return itemIndex + 1;

      default:
        return itemIndex + 1;
    }
  }
}
