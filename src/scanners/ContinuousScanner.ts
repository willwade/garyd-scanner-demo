import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';

export class ContinuousScanner extends Scanner {
  private overlay: HTMLElement | null = null;
  private hBar: HTMLElement | null = null; // Moves Vertically (y-scan)
  private vBar: HTMLElement | null = null; // Moves Horizontally (x-scan)

  // Phase 1: x-scan (Vertical Bar moves L->R)
  // Phase 2: y-scan (Horizontal Bar moves T->B)
  private state: 'x-scan' | 'y-scan' | 'processing' = 'x-scan';

  private xPos: number = 0; // percentage 0-100
  private yPos: number = 0; // percentage 0-100

  private stepSize: number = 1; // % per step

  public start() {
    this.createOverlay();
    this.state = 'x-scan';
    this.xPos = 0;
    this.yPos = 0;
    super.start();
  }

  public stop() {
    super.stop();
    this.removeOverlay();
  }

  protected reset() {
    this.state = 'x-scan';
    this.xPos = 0;
    this.yPos = 0;
    this.updateOverlay();
  }

  protected step() {
    if (this.state === 'x-scan') {
      this.xPos += this.stepSize;
      if (this.xPos > 100) this.xPos = 0;
    } else if (this.state === 'y-scan') {
      this.yPos += this.stepSize;
      if (this.yPos > 100) this.yPos = 0;
    }
    this.updateOverlay();
  }

  // Override scheduleNextStep to be faster/smoother for continuous
  protected scheduleNextStep() {
    if (!this.isRunning) return;
    // Continuous needs faster refresh than grid scan rate.
    // Use requestAnimationFrame or fast interval.
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

    // Vertical Bar (Moves Horizontally during x-scan)
    this.vBar = document.createElement('div');
    this.vBar.style.position = 'absolute';
    this.vBar.style.top = '0';
    this.vBar.style.width = '4px';
    this.vBar.style.height = '100%';
    this.vBar.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    this.vBar.style.borderLeft = '1px solid red';
    this.vBar.style.borderRight = '1px solid red';
    this.overlay.appendChild(this.vBar);

    // Horizontal Bar (Moves Vertically during y-scan)
    this.hBar = document.createElement('div');
    this.hBar.style.position = 'absolute';
    this.hBar.style.left = '0';
    this.hBar.style.width = '100%';
    this.hBar.style.height = '4px';
    this.hBar.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    this.hBar.style.borderTop = '1px solid red';
    this.hBar.style.borderBottom = '1px solid red';
    this.hBar.style.display = 'none'; // Hidden initially
    this.overlay.appendChild(this.hBar);

    // Append to the renderer's container (inside Shadow DOM)
    this.renderer.getContainer().appendChild(this.overlay);
  }

  private removeOverlay() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    this.hBar = null;
    this.vBar = null;
  }

  private updateOverlay() {
    if (!this.hBar || !this.vBar) return;

    if (this.state === 'x-scan') {
        this.vBar.style.display = 'block';
        this.vBar.style.left = `${this.xPos}%`;
        this.hBar.style.display = 'none';
    } else if (this.state === 'y-scan') {
        this.vBar.style.display = 'block';
        // vBar stays at selected xPos
        this.vBar.style.left = `${this.xPos}%`;

        this.hBar.style.display = 'block';
        this.hBar.style.top = `${this.yPos}%`;
    }
  }

  public handleAction(action: SwitchAction) {
    if (action === 'select') {
       if (this.state === 'x-scan') {
           this.state = 'y-scan';
           this.yPos = 0;
           // Provide minimal audio feedback for the intermediate step?
           // The base class handles triggers, but this is a state transition.
       } else if (this.state === 'y-scan') {
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

      // Temporarily hide overlay so elementFromPoint works
      this.overlay.style.display = 'none';

      const root = this.renderer.getContainer().getRootNode() as Document | ShadowRoot;
      const element = root.elementFromPoint ? root.elementFromPoint(clientX, clientY) : document.elementFromPoint(clientX, clientY);

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

  public getCost(itemIndex: number): number {
    const cols = this.renderer.columns;
    const totalItems = this.renderer.getItemsCount();
    const totalRows = Math.ceil(totalItems / cols);

    const row = Math.floor(itemIndex / cols);
    const col = itemIndex % cols;

    // Approximate cost based on position (0-100 range for Y and X)
    const yCost = ((row + 0.5) / totalRows) * 100;
    const xCost = ((col + 0.5) / cols) * 100;

    // Total steps (1 per %)
    return Math.round(xCost + yCost);
  }
}
