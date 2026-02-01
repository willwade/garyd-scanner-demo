import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';

export class ContinuousScanner extends Scanner {
  private overlay: HTMLElement | null = null;
  private hBar: HTMLElement | null = null; // Horizontal bar (crosshair)
  private vBar: HTMLElement | null = null; // Vertical bar (crosshair)
  private bufferZone: HTMLElement | null = null; // Moving buffer (gliding)
  private lockedXBar: HTMLElement | null = null; // Green line showing locked X position

  // States differ by technique:
  // Crosshair: 'x-scan' → 'y-scan' → 'processing' (waits for switch)
  // Gliding: 'x-scanning' → 'x-capturing' → 'y-scanning' → 'y-capturing' → 'processing' (continuous movement)
  private state: 'x-scan' | 'y-scan' | 'x-scanning' | 'x-capturing' | 'y-scanning' | 'y-capturing' | 'processing' = 'x-scan';

  private xPos: number = 0; // percentage 0-100
  private yPos: number = 0; // percentage 0-100

  private technique: 'gliding' | 'crosshair' = 'crosshair';
  private numCols: number = 0;
  private numRows: number = 0;

  // For gliding cursor
  private bufferWidth: number = 15; // % of screen width for buffer zone
  private itemsInBuffer: number[] = []; // Track items in buffer for selection
  private direction: 1 | -1 = 1; // 1 = right/down, -1 = left/up
  private pauseTimer: number | null = null; // For pause before reversing
  private bufferLeft: number = 0; // Left edge of buffer zone (%)
  private bufferRight: number = 0; // Right edge of buffer zone (%)
  private bufferTop: number = 0; // Top edge of buffer zone (%)
  private bufferBottom: number = 0; // Bottom edge of buffer zone (%)
  private fineXPos: number = 0; // Fine line position within buffer zone (%)
  private fineYPos: number = 0; // Fine line position within buffer zone (%)
  private lockedXPosition: number = 0; // Actual X position when locked (%)

  public start() {
    try {
      const config = this.config.get();
      this.technique = config.continuousTechnique || 'crosshair';

      // Calculate grid dimensions
      const totalItems = this.renderer.getItemsCount();
      this.numCols = this.renderer.columns;
      this.numRows = Math.ceil(totalItems / this.numCols);

      console.log('[ContinuousScanner] Starting:', {
        technique: this.technique,
        numCols: this.numCols,
        numRows: this.numRows,
        totalItems
      });

      this.createOverlay();

      // Set initial state based on technique
      this.state = this.technique === 'gliding' ? 'x-scanning' : 'x-scan';
      this.xPos = 0;
      this.yPos = 0;
      this.direction = 1; // Start moving right
      this.fineXPos = 0;
      this.fineYPos = 0;
      this.bufferLeft = 0;
      this.bufferRight = this.bufferWidth;
      this.bufferTop = 0;
      this.bufferBottom = this.bufferWidth;
      this.lockedXPosition = 0;

      console.log('[ContinuousScanner] Initial state:', this.state);

      super.start();
    } catch (error) {
      console.error('[ContinuousScanner] ERROR in start():', error);
      throw error;
    }
  }

  public stop() {
    super.stop();
    if (this.pauseTimer) {
      window.clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
    this.removeOverlay();
  }

  protected reset() {
    this.state = this.technique === 'gliding' ? 'x-scanning' : 'x-scan';
    this.xPos = 0;
    this.yPos = 0;
    this.direction = 1;
    this.fineXPos = 0;
    this.fineYPos = 0;
    this.bufferLeft = 0;
    this.bufferRight = this.bufferWidth;
    this.bufferTop = 0;
    this.bufferBottom = this.bufferWidth;
    this.lockedXPosition = 0;
    this.itemsInBuffer = [];
    this.renderer.setFocus([]);

    // Hide all overlays
    if (this.lockedXBar) this.lockedXBar.style.display = 'none';

    this.updateOverlay();
  }

  protected step() {
    if (this.technique === 'gliding') {
      if (this.state === 'x-scanning') {
        // Stage 1: Move X buffer zone across full screen (faster)
        this.xPos += 0.8 * this.direction;

        // Bounce off edges with pause
        if (this.xPos >= 100) {
          this.xPos = 100;
          if (!this.pauseTimer) {
            this.pauseTimer = window.setTimeout(() => {
              this.direction = -1;
              this.pauseTimer = null;
            }, 100);
            return;
          }
        } else if (this.xPos <= 0) {
          this.xPos = 0;
          if (!this.pauseTimer) {
            this.pauseTimer = window.setTimeout(() => {
              this.direction = 1;
              this.pauseTimer = null;
            }, 100);
            return;
          }
        }

        // Update buffer zone position
        this.bufferLeft = Math.max(0, this.xPos - this.bufferWidth / 2);
        this.bufferRight = Math.min(100, this.xPos + this.bufferWidth / 2);
      } else if (this.state === 'x-capturing') {
        // Stage 2: Fine X line scans within buffer zone (bounces back and forth)
        this.fineXPos += 0.3 * this.direction;

        // Bounce within buffer zone (0-100% relative to buffer)
        if (this.fineXPos >= 100) {
          this.fineXPos = 100;
          this.direction = -1;
        } else if (this.fineXPos <= 0) {
          this.fineXPos = 0;
          this.direction = 1;
        }
      } else if (this.state === 'y-scanning') {
        // Stage 3: Move Y buffer zone down the screen (faster)
        this.yPos += 0.8 * this.direction;

        // Bounce off edges with pause
        if (this.yPos >= 100) {
          this.yPos = 100;
          if (!this.pauseTimer) {
            this.pauseTimer = window.setTimeout(() => {
              this.direction = -1;
              this.pauseTimer = null;
            }, 100);
            return;
          }
        } else if (this.yPos <= 0) {
          this.yPos = 0;
          if (!this.pauseTimer) {
            this.pauseTimer = window.setTimeout(() => {
              this.direction = 1;
              this.pauseTimer = null;
            }, 100);
            return;
          }
        }

        // Update buffer zone position
        this.bufferTop = Math.max(0, this.yPos - this.bufferWidth / 2);
        this.bufferBottom = Math.min(100, this.yPos + this.bufferWidth / 2);
      } else if (this.state === 'y-capturing') {
        // Stage 4: Fine Y line scans within buffer zone (bounces back and forth)
        this.fineYPos += 0.3 * this.direction;

        // Bounce within buffer zone (0-100% relative to buffer)
        if (this.fineYPos >= 100) {
          this.fineYPos = 100;
          this.direction = -1;
        } else if (this.fineYPos <= 0) {
          this.fineYPos = 0;
          this.direction = 1;
        }
      }
    } else {
      // Crosshair: Continuous scanning that wraps around
      if (this.state === 'x-scan') {
        this.xPos += 0.5; // Smooth continuous movement
        if (this.xPos > 100) this.xPos = 0; // Wrap back to left
      } else if (this.state === 'y-scan') {
        this.yPos += 0.5; // Smooth continuous movement
        if (this.yPos > 100) this.yPos = 0; // Wrap back to top
      }
    }

    // Log every 50th step to avoid spam
    if (Math.floor(this.xPos * 2) % 50 === 0) {
      console.log('[ContinuousScanner] Step:', {
        state: this.state,
        xPos: this.xPos,
        yPos: this.yPos,
        fineXPos: this.fineXPos,
        fineYPos: this.fineYPos,
        bufferLeft: this.bufferLeft,
        bufferRight: this.bufferRight,
        technique: this.technique,
        direction: this.direction
      });
    }

    this.updateOverlay();
  }

  private updateItemsInBuffer() {
    // Find all items whose horizontal center is within the buffer
    const bufferLeft = Math.max(0, this.xPos - this.bufferWidth / 2);
    const bufferRight = Math.min(100, this.xPos + this.bufferWidth / 2);
    const totalItems = this.renderer.getItemsCount();
    const cols = this.numCols;
    const indices: number[] = [];

    for (let i = 0; i < totalItems; i++) {
      const col = i % cols;
      const itemCenter = ((col + 0.5) / cols) * 100;

      if (itemCenter >= bufferLeft && itemCenter <= bufferRight) {
        indices.push(i);
      }
    }

    this.itemsInBuffer = indices;
    // Don't visually highlight - just track for selection
  }

  // Override scheduleNextStep for different refresh rates
  protected scheduleNextStep() {
    if (!this.isRunning) return;
    if (this.timer) clearTimeout(this.timer);

    // Use faster refresh rate for smoother animation
    const delay = 20; // 20ms = 50fps for smooth movement

    this.timer = window.setTimeout(() => {
        this.step();
        this.scheduleNextStep();
    }, delay);
  }

  private createOverlay() {
    if (this.overlay) return;

    console.log('[ContinuousScanner] Creating overlay...');

    const container = this.renderer.getContainer();
    console.log('[ContinuousScanner] Container:', container);

    this.overlay = document.createElement('div');
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100%';
    this.overlay.style.height = '100%';
    this.overlay.style.pointerEvents = 'none'; // click through
    this.overlay.style.zIndex = '1000'; // High z-index to ensure overlay is above everything

    // Buffer Zone (for gliding cursor) - grey semi-transparent overlay
    this.bufferZone = document.createElement('div');
    this.bufferZone.style.position = 'absolute';
    this.bufferZone.style.top = '0';
    this.bufferZone.style.height = '100%';
    this.bufferZone.style.backgroundColor = 'rgba(128, 128, 128, 0.4)'; // Grey semi-transparent
    this.bufferZone.style.borderLeft = '2px solid rgba(128, 128, 128, 0.8)';
    this.bufferZone.style.borderRight = '2px solid rgba(128, 128, 128, 0.8)';
    this.bufferZone.style.pointerEvents = 'none';
    this.bufferZone.style.display = 'none'; // Hidden initially
    this.overlay.appendChild(this.bufferZone);

    // Vertical Bar (for crosshair technique)
    this.vBar = document.createElement('div');
    this.vBar.style.position = 'absolute';
    this.vBar.style.top = '0';
    this.vBar.style.width = '4px';
    this.vBar.style.height = '100%';
    this.vBar.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    this.vBar.style.borderLeft = '1px solid red';
    this.vBar.style.borderRight = '1px solid red';
    this.vBar.style.display = 'none'; // Hidden initially
    this.overlay.appendChild(this.vBar);

    // Horizontal Bar (for crosshair technique)
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

    // Locked X Bar (green line showing locked X position during Y stages)
    this.lockedXBar = document.createElement('div');
    this.lockedXBar.style.position = 'absolute';
    this.lockedXBar.style.top = '0';
    this.lockedXBar.style.width = '3px';
    this.lockedXBar.style.height = '100%';
    this.lockedXBar.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
    this.lockedXBar.style.borderLeft = '1px solid green';
    this.lockedXBar.style.borderRight = '1px solid green';
    this.lockedXBar.style.display = 'none'; // Hidden initially
    this.overlay.appendChild(this.lockedXBar);

    // Append to the renderer's container (inside Shadow DOM)
    container.appendChild(this.overlay);

    console.log('[ContinuousScanner] Overlay created and appended');
  }

  private removeOverlay() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    this.hBar = null;
    this.vBar = null;
    this.bufferZone = null;
    this.lockedXBar = null;
  }

  public handleAction(action: SwitchAction) {
    console.log('[ContinuousScanner] handleAction:', {
      action,
      state: this.state,
      technique: this.technique
    });

    if (action === 'select') {
      if (this.technique === 'gliding') {
        // Gliding cursor: four-stage selection (X coarse, X fine, Y coarse, Y fine)
        if (this.state === 'x-scanning') {
          // First select: lock X buffer zone, start fine X scanning
          console.log('[ContinuousScanner] Transition: x-scanning -> x-capturing');
          this.state = 'x-capturing';
          this.fineXPos = 0;
          this.direction = 1;
        } else if (this.state === 'x-capturing') {
          // Second select: lock X position, start Y buffer zone scanning
          console.log('[ContinuousScanner] Transition: x-capturing -> y-scanning');
          this.state = 'y-scanning';
          // Store the actual locked X position
          this.lockedXPosition = this.bufferLeft + (this.fineXPos / 100) * (this.bufferRight - this.bufferLeft);
          this.yPos = 0;
          this.fineYPos = 0;
          this.direction = 1;
        } else if (this.state === 'y-scanning') {
          // Third select: lock Y buffer zone, start fine Y scanning
          console.log('[ContinuousScanner] Transition: y-scanning -> y-capturing');
          this.state = 'y-capturing';
          this.fineYPos = 0;
          this.direction = 1;
        } else if (this.state === 'y-capturing') {
          // Fourth select: pick the item at the intersection
          console.log('[ContinuousScanner] Transition: y-capturing -> processing');
          this.state = 'processing';
          this.selectFocusedItem();
        }
      } else {
        // Crosshair: stepping movement
        if (this.state === 'x-scan') {
          console.log('[ContinuousScanner] Transition: x-scan -> y-scan');
          this.state = 'y-scan';
          this.yPos = 0;
        } else if (this.state === 'y-scan') {
          console.log('[ContinuousScanner] Transition: y-scan -> processing');
          this.state = 'processing';
          this.selectAtPoint();
        }
      }
    } else if (action === 'cancel') {
      console.log('[ContinuousScanner] Cancel - resetting');
      this.reset();
    }
  }

  private selectFocusedItem() {
    // For gliding cursor: select item at intersection of fine X and Y lines
    if (!this.overlay) return;

    const rect = this.overlay.getBoundingClientRect();
    // Use locked X position and fine Y position
    const actualYPos = this.bufferTop + (this.fineYPos / 100) * (this.bufferBottom - this.bufferTop);
    const clientX = rect.left + (this.lockedXPosition / 100) * rect.width;
    const clientY = rect.top + (actualYPos / 100) * rect.height;

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

  private updateOverlay() {
    if (!this.hBar || !this.vBar || !this.bufferZone || !this.lockedXBar) {
      console.error('[ContinuousScanner] updateOverlay: Missing elements!', {
        hBar: !!this.hBar,
        vBar: !!this.vBar,
        bufferZone: !!this.bufferZone,
        lockedXBar: !!this.lockedXBar,
        overlay: !!this.overlay
      });
      return;
    }

    console.log('[ContinuousScanner] updateOverlay:', {
      technique: this.technique,
      state: this.state,
      xPos: this.xPos,
      yPos: this.yPos
    });

    if (this.technique === 'gliding') {
      // Gliding: Four-stage selection
      if (this.state === 'x-scanning') {
        // Stage 1: X coarse positioning - show vertical buffer zone
        this.vBar.style.display = 'none';
        this.hBar.style.display = 'none';
        if (this.lockedXBar) this.lockedXBar.style.display = 'none';

        const bufferLeft = Math.max(0, this.xPos - this.bufferWidth / 2);
        const bufferRight = Math.min(100, this.xPos + this.bufferWidth / 2);
        const actualWidth = bufferRight - bufferLeft;

        this.bufferZone.style.left = `${bufferLeft}%`;
        this.bufferZone.style.width = `${actualWidth}%`;
        this.bufferZone.style.height = '100%';
        this.bufferZone.style.top = '0';
        this.bufferZone.style.display = 'block';
      } else if (this.state === 'x-capturing') {
        // Stage 2: X fine positioning - keep buffer zone, add fine vertical line
        this.hBar.style.display = 'none';
        if (this.lockedXBar) this.lockedXBar.style.display = 'none';

        const actualWidth = this.bufferRight - this.bufferLeft;
        this.bufferZone.style.left = `${this.bufferLeft}%`;
        this.bufferZone.style.width = `${actualWidth}%`;
        this.bufferZone.style.height = '100%';
        this.bufferZone.style.top = '0';
        this.bufferZone.style.display = 'block';

        const actualXPos = this.bufferLeft + (this.fineXPos / 100) * (this.bufferRight - this.bufferLeft);
        this.vBar.style.display = 'block';
        this.vBar.style.left = `${actualXPos}%`;
      } else if (this.state === 'y-scanning') {
        // Stage 3: Y coarse positioning - show horizontal buffer zone + locked X line
        this.vBar.style.display = 'none';
        this.hBar.style.display = 'none';

        // Show green locked X line
        this.lockedXBar.style.display = 'block';
        this.lockedXBar.style.left = `${this.lockedXPosition}%`;

        const bufferTop = Math.max(0, this.yPos - this.bufferWidth / 2);
        const bufferBottom = Math.min(100, this.yPos + this.bufferWidth / 2);
        const actualHeight = bufferBottom - bufferTop;

        this.bufferZone.style.left = '0';
        this.bufferZone.style.width = '100%';
        this.bufferZone.style.top = `${bufferTop}%`;
        this.bufferZone.style.height = `${actualHeight}%`;
        this.bufferZone.style.display = 'block';
      } else if (this.state === 'y-capturing') {
        // Stage 4: Y fine positioning - keep buffer zone, add fine horizontal line + locked X line
        this.vBar.style.display = 'none';

        // Show green locked X line
        this.lockedXBar.style.display = 'block';
        this.lockedXBar.style.left = `${this.lockedXPosition}%`;

        const actualHeight = this.bufferBottom - this.bufferTop;
        this.bufferZone.style.left = '0';
        this.bufferZone.style.width = '100%';
        this.bufferZone.style.top = `${this.bufferTop}%`;
        this.bufferZone.style.height = `${actualHeight}%`;
        this.bufferZone.style.display = 'block';

        const actualYPos = this.bufferTop + (this.fineYPos / 100) * (this.bufferBottom - this.bufferTop);
        this.hBar.style.display = 'block';
        this.hBar.style.top = `${actualYPos}%`;
      }
    } else {
      // Crosshair: Show X-Y bars only (no cell highlighting)
      this.bufferZone.style.display = 'none';
      if (this.lockedXBar) this.lockedXBar.style.display = 'none';

      // xPos and yPos are now 0-100%, direct percentage values
      if (this.state === 'x-scan') {
        this.vBar.style.display = 'block';
        this.vBar.style.left = `${this.xPos}%`;
        this.hBar.style.display = 'none';
      } else if (this.state === 'y-scan') {
        this.vBar.style.display = 'block';
        this.vBar.style.left = `${this.xPos}%`;
        this.hBar.style.display = 'block';
        this.hBar.style.top = `${this.yPos}%`;
      }
    }
  }

  private selectAtPoint() {
    // For crosshair technique: select item at intersection
    if (!this.overlay) return;

    const rect = this.overlay.getBoundingClientRect();
    // xPos and yPos are already 0-100% values
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
    const row = Math.floor(itemIndex / cols);
    const col = itemIndex % cols;

    if (this.technique === 'gliding') {
      // Gliding: Wait for cursor to reach item, then select
      // Cost = time to reach item + 1 click
      const itemCenter = ((col + 0.5) / cols) * 100;
      return Math.round(itemCenter / 0.5) + 1; // Steps to reach item + 1 click
    } else {
      // Crosshair: time to scan X to item, then Y to item
      const xPosition = ((col + 0.5) / cols) * 100;
      const yPosition = ((row + 0.5) / Math.ceil(this.renderer.getItemsCount() / cols)) * 100;
      const xSteps = Math.round(xPosition / 0.5); // Steps to reach X position
      const ySteps = Math.round(yPosition / 0.5); // Steps to reach Y position
      return xSteps + ySteps + 2; // X scan + Y scan + 2 clicks
    }
  }
}
