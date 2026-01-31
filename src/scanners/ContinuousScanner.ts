import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';

export class ContinuousScanner extends Scanner {
  private overlay: HTMLElement | null = null;
  private hBar: HTMLElement | null = null;
  private cursor: HTMLElement | null = null;

  private state: 'y-scan' | 'x-scan' | 'processing' = 'y-scan';
  private yPos: number = 0; // percentage 0-100
  private xPos: number = 0; // percentage 0-100

  private stepSize: number = 1; // % per step

  public start() {
    this.createOverlay();
    this.state = 'y-scan';
    this.yPos = 0;
    this.xPos = 0;
    super.start();
  }

  public stop() {
    super.stop();
    this.removeOverlay();
  }

  protected reset() {
    this.state = 'y-scan';
    this.yPos = 0;
    this.xPos = 0;
    this.updateOverlay();
  }

  protected step() {
    if (this.state === 'y-scan') {
      this.yPos += this.stepSize;
      if (this.yPos > 100) this.yPos = 0;
    } else if (this.state === 'x-scan') {
      this.xPos += this.stepSize;
      if (this.xPos > 100) this.xPos = 0;
    }
    this.updateOverlay();
  }

  // Override scheduleNextStep to be faster/smoother for continuous
  protected scheduleNextStep() {
    if (!this.isRunning) return;
    // Continuous needs faster refresh than grid scan rate.
    // Use requestAnimationFrame or fast interval.
    // Let's use 20ms.
    if (this.timer) clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
        this.step();
        this.scheduleNextStep();
    }, 20);
  }

  private createOverlay() {
    if (this.overlay) return;
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100%';
    this.overlay.style.height = '100%';
    this.overlay.style.pointerEvents = 'none'; // click through
    this.overlay.style.zIndex = '50';

    // H-Bar (Moving vertically)
    this.hBar = document.createElement('div');
    this.hBar.style.position = 'absolute';
    this.hBar.style.left = '0';
    this.hBar.style.width = '100%';
    this.hBar.style.height = '2px';
    this.hBar.style.backgroundColor = 'red';
    this.overlay.appendChild(this.hBar);

    // Cursor (Moving horizontally on the bar)
    this.cursor = document.createElement('div');
    this.cursor.style.position = 'absolute';
    this.cursor.style.width = '10px';
    this.cursor.style.height = '10px';
    this.cursor.style.backgroundColor = 'blue';
    this.cursor.style.borderRadius = '50%';
    this.cursor.style.transform = 'translate(-50%, -50%)';
    this.cursor.style.display = 'none';
    this.overlay.appendChild(this.cursor);

    document.getElementById('grid-container')?.appendChild(this.overlay);
  }

  private removeOverlay() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
  }

  private updateOverlay() {
    if (!this.hBar || !this.cursor) return;

    this.hBar.style.top = `${this.yPos}%`;

    if (this.state === 'x-scan') {
        this.cursor.style.display = 'block';
        this.cursor.style.top = `${this.yPos}%`;
        this.cursor.style.left = `${this.xPos}%`;
    } else {
        this.cursor.style.display = 'none';
    }
  }

  public handleAction(action: SwitchAction) {
    if (action === 'select') {
       if (this.state === 'y-scan') {
           this.state = 'x-scan';
           this.xPos = 0;
       } else if (this.state === 'x-scan') {
           this.state = 'processing';
           this.selectAtPoint();
       }
    } else if (action === 'cancel') {
        this.reset();
    }
  }

  private selectAtPoint() {
      if (!this.overlay) return;

      // Calculate screen coordinates
      const rect = this.overlay.getBoundingClientRect();
      const clientX = rect.left + (this.xPos / 100) * rect.width;
      const clientY = rect.top + (this.yPos / 100) * rect.height;

      // Temporarily hide overlay to elementFromPoint works
      this.overlay.style.display = 'none';
      const element = document.elementFromPoint(clientX, clientY);
      this.overlay.style.display = 'block';

      if (element) {
          const gridCell = element.closest('.grid-cell') as HTMLElement;
          if (gridCell && gridCell.dataset.index) {
              const index = parseInt(gridCell.dataset.index, 10);
              const item = this.renderer.getItem(index);
              if (item) {
                  this.renderer.setSelected(index);
                  this.triggerSelection(item);
              }
          }
      }

      this.reset();
  }
}
