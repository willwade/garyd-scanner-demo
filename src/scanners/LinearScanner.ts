import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';

export class LinearScanner extends Scanner {
  private currentIndex: number = -1;
  private totalItems: number = 0;

  public start() {
    // Need to know how many items are in the grid
    // For now we assume the renderer has items loaded.
    // In a real scenario, we might query the renderer or pass the items.
    // We can use a trick: try to get items until undefined.
    this.totalItems = this.countItems();
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
    this.renderer.setFocus([]);
  }

  protected step() {
    this.currentIndex++;
    if (this.currentIndex >= this.totalItems) {
      this.currentIndex = 0; // Loop
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
    return itemIndex + 1;
  }
}
