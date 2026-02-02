import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';

export class ContinuousScanner extends Scanner {
  private overlay: HTMLElement | null = null;
  private hBar: HTMLElement | null = null; // Horizontal bar (crosshair)
  private vBar: HTMLElement | null = null; // Vertical bar (crosshair)
  private bufferZone: HTMLElement | null = null; // Moving buffer (gliding)
  private lockedXBar: HTMLElement | null = null; // Green line showing locked X position
  private directionIndicator: HTMLElement | null = null; // Arrow/compass for eight-direction mode
  private directionLine: HTMLElement | null = null; // Line showing path for eight-direction mode

  // States differ by technique:
  // Crosshair: 'x-scan' → 'y-scan' → 'processing' (waits for switch)
  // Gliding: 'x-scanning' → 'x-capturing' → 'y-scanning' → 'y-capturing' → 'processing' (continuous movement)
  // Eight-Direction: 'direction-scan' → 'moving' → 'processing' (compass direction selection)
  private state: 'x-scan' | 'y-scan' | 'x-scanning' | 'x-capturing' | 'y-scanning' | 'y-capturing' | 'direction-scan' | 'moving' | 'processing' = 'x-scan';

  private xPos: number = 0; // percentage 0-100
  private yPos: number = 0; // percentage 0-100

  private technique: 'gliding' | 'crosshair' | 'eight-direction' = 'crosshair';
  private numCols: number = 0;
  private numRows: number = 0;

  // For gliding cursor
  private bufferWidth: number = 15; // % of screen width for buffer zone
  private direction: 1 | -1 = 1; // 1 = right/down, -1 = left/up
  private pauseTimer: number | null = null; // For pause before reversing
  private bufferLeft: number = 0; // Left edge of buffer zone (%)
  private bufferRight: number = 0; // Right edge of buffer zone (%)
  private bufferTop: number = 0; // Top edge of buffer zone (%)
  private bufferBottom: number = 0; // Bottom edge of buffer zone (%)
  private fineXPos: number = 0; // Fine line position within buffer zone (%)
  private fineYPos: number = 0; // Fine line position within buffer zone (%)
  private lockedXPosition: number = 0; // Actual X position when locked (%)

  // Eight-direction mode
  private currentDirection: number = 0; // 0-7 for 8 directions (N, NE, E, SE, S, SW, W, NW)
  private compassAngle: number = 0; // Continuous angle 0-359 for fluid rotation
  private compassMode: 'continuous' | 'fixed-8' = 'continuous'; // Fluid vs discrete
  private directionStepCounter: number = 0; // Counter for slowing direction cycling
  private directionStepsPerChange: number = 10; // How many steps before changing direction (fixed-8 mode)
  private directions = [
    { name: 'N', angle: 0, dx: 0, dy: -1 },      // North
    { name: 'NE', angle: 45, dx: 1, dy: -1 },    // Northeast
    { name: 'E', angle: 90, dx: 1, dy: 0 },      // East
    { name: 'SE', angle: 135, dx: 1, dy: 1 },    // Southeast
    { name: 'S', angle: 180, dx: 0, dy: 1 },     // South
    { name: 'SW', angle: 225, dx: -1, dy: 1 },   // Southwest
    { name: 'W', angle: 270, dx: -1, dy: 0 },    // West
    { name: 'NW', angle: 315, dx: -1, dy: -1 }   // Northwest
  ];

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
      if (this.technique === 'gliding') {
        this.state = 'x-scanning';
        this.xPos = 0;
        this.yPos = 0;
      } else if (this.technique === 'eight-direction') {
        this.state = 'direction-scan';
        this.xPos = 50; // Start in center for eight-direction mode
        this.yPos = 50;
        this.compassMode = config.compassMode || 'continuous';
        this.compassAngle = 0;
      } else {
        this.state = 'x-scan';
        this.xPos = 0;
        this.yPos = 0;
      }

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
    if (this.technique === 'gliding') {
      this.state = 'x-scanning';
      this.xPos = 0;
      this.yPos = 0;
    } else if (this.technique === 'eight-direction') {
      this.state = 'direction-scan';
      this.xPos = 50; // Start in center for eight-direction mode
      this.yPos = 50;
    } else {
      this.state = 'x-scan';
      this.xPos = 0;
      this.yPos = 0;
    }

    this.direction = 1;
    this.fineXPos = 0;
    this.fineYPos = 0;
    this.bufferLeft = 0;
    this.bufferRight = this.bufferWidth;
    this.bufferTop = 0;
    this.bufferBottom = this.bufferWidth;
    this.lockedXPosition = 0;
    this.currentDirection = 0;
    this.compassAngle = 0;
    this.directionStepCounter = 0;
    this.renderer.setFocus([]);

    // Hide all overlays
    if (this.lockedXBar) this.lockedXBar.style.display = 'none';
    if (this.directionIndicator) this.directionIndicator.style.display = 'none';
    if (this.directionLine) this.directionLine.style.display = 'none';

    this.updateOverlay();
  }

  protected step() {
    if (this.technique === 'eight-direction') {
      if (this.state === 'direction-scan') {
        if (this.compassMode === 'continuous') {
          // Fluid clock-like rotation
          this.compassAngle = (this.compassAngle + 2) % 360; // 2 degrees per step
        } else {
          // Fixed 8 directions
          this.directionStepCounter++;
          if (this.directionStepCounter >= this.directionStepsPerChange) {
            this.currentDirection = (this.currentDirection + 1) % 8;
            this.directionStepCounter = 0;
          }
          this.compassAngle = this.directions[this.currentDirection].angle;
        }
      } else if (this.state === 'moving') {
        // Move in the selected direction
        const dir = this.compassMode === 'continuous'
          ? this.getDirectionFromAngle(this.compassAngle)
          : this.directions[this.currentDirection];

        const speed = 0.5; // Movement speed

        this.xPos += dir.dx * speed;
        this.yPos += dir.dy * speed;

        // Keep within bounds
        this.xPos = Math.max(0, Math.min(100, this.xPos));
        this.yPos = Math.max(0, Math.min(100, this.yPos));
      }
    } else if (this.technique === 'gliding') {
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
        direction: this.direction,
        currentDirection: this.currentDirection
      });
    }

    this.updateOverlay();
  }

  private calculateLineLength(x: number, y: number, dx: number, dy: number): number {
    // Calculate the distance from current position to the edge of the screen
    // in the given direction (dx, dy), as a percentage

    if (dx === 0 && dy === -1) {
      // North - distance to top edge
      return y;
    } else if (dx === 1 && dy === -1) {
      // Northeast - distance to top or right edge, whichever is closer
      return Math.min(100 - x, y) * Math.SQRT2;
    } else if (dx === 1 && dy === 0) {
      // East - distance to right edge
      return 100 - x;
    } else if (dx === 1 && dy === 1) {
      // Southeast - distance to bottom or right edge, whichever is closer
      return Math.min(100 - x, 100 - y) * Math.SQRT2;
    } else if (dx === 0 && dy === 1) {
      // South - distance to bottom edge
      return 100 - y;
    } else if (dx === -1 && dy === 1) {
      // Southwest - distance to bottom or left edge, whichever is closer
      return Math.min(x, 100 - y) * Math.SQRT2;
    } else if (dx === -1 && dy === 0) {
      // West - distance to left edge
      return x;
    } else if (dx === -1 && dy === -1) {
      // Northwest - distance to top or left edge, whichever is closer
      return Math.min(x, y) * Math.SQRT2;
    }

    return 50; // Default fallback
  }

  private getDirectionFromAngle(angle: number): { dx: number; dy: number; name: string } {
    // Convert angle to direction vector
    const radians = (angle * Math.PI) / 180;
    const dx = Math.cos(radians);
    const dy = Math.sin(radians);

    // Find closest cardinal direction for naming
    const normalizedAngle = (angle + 22.5) % 360; // Offset by 22.5 degrees for proper rounding
    const directionIndex = Math.floor(normalizedAngle / 45);
    const names = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    const name = names[directionIndex] || 'N';

    return { dx, dy, name };
  }

  // Override scheduleNextStep for different refresh rates
  protected scheduleNextStep() {
    if (!this.isRunning) return;

    // Don't auto-schedule steps in manual mode
    if (this.config.get().scanInputMode === 'manual') {
      return;
    }

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

    // Direction Indicator (for eight-direction mode) - shows an arrow pointing in current direction
    this.directionIndicator = document.createElement('div');
    this.directionIndicator.style.position = 'absolute';
    this.directionIndicator.style.top = '10px';
    this.directionIndicator.style.right = '10px';
    this.directionIndicator.style.width = '80px';
    this.directionIndicator.style.height = '80px';
    this.directionIndicator.style.borderRadius = '50%';
    this.directionIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    this.directionIndicator.style.border = '3px solid #333';
    this.directionIndicator.style.display = 'none'; // Hidden initially
    this.directionIndicator.style.pointerEvents = 'none';
    this.overlay.appendChild(this.directionIndicator);

    // Direction Line (for eight-direction mode) - shows the path the cursor will take
    this.directionLine = document.createElement('div');
    this.directionLine.style.position = 'absolute';
    this.directionLine.style.height = '2px';
    this.directionLine.style.backgroundColor = 'rgba(33, 150, 243, 0.6)';
    this.directionLine.style.transformOrigin = '0 50%';
    this.directionLine.style.display = 'none'; // Hidden initially
    this.directionLine.style.pointerEvents = 'none';
    this.directionLine.style.zIndex = '5';
    this.overlay.appendChild(this.directionLine);

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
    this.directionIndicator = null;
    this.directionLine = null;
  }

  public handleAction(action: SwitchAction) {
    console.log('[ContinuousScanner] handleAction:', {
      action,
      state: this.state,
      technique: this.technique
    });

    if (action === 'cancel') {
      console.log('[ContinuousScanner] Cancel - resetting');
      this.reset();
    } else {
      // Let base class handle select, reset, step, etc.
      super.handleAction(action);
    }
  }

  protected doSelection() {
    if (this.technique === 'eight-direction') {
      // Eight-direction: direction selection → movement → selection
      if (this.state === 'direction-scan') {
        // First select: start moving in selected direction
        const dirInfo = this.getDirectionFromAngle(this.compassAngle);
        console.log('[ContinuousScanner] Transition: direction-scan -> moving, direction:', dirInfo.name, 'angle:', this.compassAngle);
        this.state = 'moving';
      } else if (this.state === 'moving') {
        // Second select: stop and select item at current position
        console.log('[ContinuousScanner] Transition: moving -> processing');
        this.state = 'processing';
        this.selectFocusedItem();
      }
    } else if (this.technique === 'gliding') {
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
  }

  private selectFocusedItem() {
    // For eight-direction and gliding cursor: select item at current position
    if (!this.overlay) return;

    const rect = this.overlay.getBoundingClientRect();
    let clientX, clientY;

    if (this.technique === 'eight-direction') {
      // Use current cursor position
      clientX = rect.left + (this.xPos / 100) * rect.width;
      clientY = rect.top + (this.yPos / 100) * rect.height;
    } else {
      // Gliding cursor: Use locked X position and fine Y position
      const actualYPos = this.bufferTop + (this.fineYPos / 100) * (this.bufferBottom - this.bufferTop);
      clientX = rect.left + (this.lockedXPosition / 100) * rect.width;
      clientY = rect.top + (actualYPos / 100) * rect.height;
    }

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
    if (!this.hBar || !this.vBar || !this.bufferZone || !this.lockedXBar || !this.directionIndicator || !this.directionLine) {
      console.error('[ContinuousScanner] updateOverlay: Missing elements!', {
        hBar: !!this.hBar,
        vBar: !!this.vBar,
        bufferZone: !!this.bufferZone,
        lockedXBar: !!this.lockedXBar,
        directionIndicator: !!this.directionIndicator,
        directionLine: !!this.directionLine,
        overlay: !!this.overlay
      });
      return;
    }

    console.log('[ContinuousScanner] updateOverlay:', {
      technique: this.technique,
      state: this.state,
      xPos: this.xPos,
      yPos: this.yPos,
      currentDirection: this.currentDirection
    });

    if (this.technique === 'eight-direction') {
      // Eight-direction mode: Show compass/arrow indicator + directional line
      this.vBar.style.display = 'none';
      this.hBar.style.display = 'none';
      this.bufferZone.style.display = 'none';
      this.lockedXBar.style.display = 'none';

      this.directionIndicator.style.display = 'block';
      this.directionLine.style.display = 'block';

      // Get current direction info
      const angle = this.compassAngle;
      const dirInfo = this.getDirectionFromAngle(angle);

      // Update the compass display
      this.directionIndicator.innerHTML = `
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(${angle}deg);
          font-size: 24px;
          font-weight: bold;
          color: #2196F3;
        ">↑</div>
        <div style="
          position: absolute;
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          font-weight: bold;
        ">N</div>
        <div style="
          position: absolute;
          bottom: 5px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          font-weight: bold;
        ">S</div>
        <div style="
          position: absolute;
          left: 5px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          font-weight: bold;
        ">W</div>
        <div style="
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          font-weight: bold;
        ">E</div>
        <div style="
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: #666;
        ">${dirInfo.name} (${Math.round(angle)}°)</div>
      `;

      // Draw directional line from current position to screen edge
      // Position at cursor center
      this.directionLine.style.left = `${this.xPos}%`;
      this.directionLine.style.top = `${this.yPos}%`;

      // Calculate line length and angle
      const lineLength = this.calculateLineLength(this.xPos, this.yPos, dirInfo.dx, dirInfo.dy);
      this.directionLine.style.width = `${lineLength}%`;
      // Fix: The line should rotate around its starting point (left center)
      this.directionLine.style.transformOrigin = '0 50%';
      this.directionLine.style.transform = `rotate(${angle}deg)`;

      // Add a cursor dot at current position
      this.vBar.style.display = 'block';
      this.vBar.style.width = '12px';
      this.vBar.style.height = '12px';
      this.vBar.style.borderRadius = '50%';
      this.vBar.style.backgroundColor = this.state === 'moving' ? '#FF5722' : '#2196F3';
      this.vBar.style.border = '2px solid white';
      this.vBar.style.zIndex = '10';
      this.vBar.style.left = `calc(${this.xPos}% - 6px)`;
      this.vBar.style.top = `calc(${this.yPos}% - 6px)`;
    } else if (this.technique === 'gliding') {
      // Gliding: Four-stage selection
      if (this.state === 'x-scanning') {
        // Stage 1: X coarse positioning - show vertical buffer zone
        this.vBar.style.display = 'none';
        this.hBar.style.display = 'none';
        if (this.lockedXBar) this.lockedXBar.style.display = 'none';
        if (this.directionIndicator) this.directionIndicator.style.display = 'none';
        if (this.directionLine) this.directionLine.style.display = 'none';

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
        if (this.directionIndicator) this.directionIndicator.style.display = 'none';
        if (this.directionLine) this.directionLine.style.display = 'none';

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
        if (this.directionIndicator) this.directionIndicator.style.display = 'none';
        if (this.directionLine) this.directionLine.style.display = 'none';

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
        if (this.directionIndicator) this.directionIndicator.style.display = 'none';
        if (this.directionLine) this.directionLine.style.display = 'none';

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
      if (this.directionIndicator) this.directionIndicator.style.display = 'none';
      if (this.directionLine) this.directionLine.style.display = 'none';

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

    if (this.technique === 'eight-direction') {
      // Eight-direction: Wait for direction to align, then move to item, then select
      // Approximate: wait for correct direction (avg 4 steps) + distance + 1 click
      const itemCenterX = ((col + 0.5) / cols) * 100;
      const itemCenterY = ((row + 0.5) / Math.ceil(this.renderer.getItemsCount() / cols)) * 100;
      const distance = Math.sqrt(Math.pow(itemCenterX, 2) + Math.pow(itemCenterY, 2)); // Distance from start
      return 4 + Math.round(distance / 0.5) + 1; // Direction wait + movement + click
    } else if (this.technique === 'gliding') {
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
