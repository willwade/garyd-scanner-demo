import { Scanner } from '../Scanner';
import type { ContinuousUpdate, SwitchAction } from '../types';

export class ContinuousScanner extends Scanner {
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
      const totalItems = this.surface.getItemsCount();
      this.numCols = this.surface.getColumns();
      this.numRows = Math.ceil(totalItems / this.numCols);

      console.log('[ContinuousScanner] Starting:', {
        technique: this.technique,
        numCols: this.numCols,
        numRows: this.numRows,
        totalItems
      });

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

      this.emitUpdate();
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
    this.surface.setFocus([]);

    this.emitUpdate();
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

    this.emitUpdate();
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
    if (this.technique === 'eight-direction') {
      this.selectAtPercent(this.xPos, this.yPos);
      return;
    }

    const actualYPos = this.bufferTop + (this.fineYPos / 100) * (this.bufferBottom - this.bufferTop);
    this.selectAtPercent(this.lockedXPosition, actualYPos);
  }

  private selectAtPoint() {
    this.selectAtPercent(this.xPos, this.yPos);
  }

  private selectAtPercent(xPercent: number, yPercent: number) {
    let index: number | null = null;
    if (this.surface.resolveIndexAtPoint) {
      index = this.surface.resolveIndexAtPoint(xPercent, yPercent);
    } else {
      index = this.estimateIndexAtPercent(xPercent, yPercent);
    }

    if (index !== null && index >= 0) {
      this.triggerSelection(index);
    }
    this.reset();
  }

  private estimateIndexAtPercent(xPercent: number, yPercent: number): number | null {
    const totalItems = this.surface.getItemsCount();
    if (!totalItems) return null;
    const cols = Math.max(1, this.surface.getColumns());
    const rows = Math.max(1, Math.ceil(totalItems / cols));
    const col = Math.min(cols - 1, Math.max(0, Math.floor((xPercent / 100) * cols)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor((yPercent / 100) * rows)));
    const index = row * cols + col;
    if (index >= totalItems) return totalItems - 1;
    return index;
  }

  private emitUpdate() {
    const dirInfo = this.getDirectionFromAngle(this.compassAngle);
    const update: ContinuousUpdate = {
      technique: this.technique,
      state: this.state,
      xPos: this.xPos,
      yPos: this.yPos,
      bufferLeft: this.bufferLeft,
      bufferRight: this.bufferRight,
      bufferTop: this.bufferTop,
      bufferBottom: this.bufferBottom,
      fineXPos: this.fineXPos,
      fineYPos: this.fineYPos,
      lockedXPosition: this.lockedXPosition,
      compassAngle: this.compassAngle,
      currentDirection: this.currentDirection,
      directionName: dirInfo.name,
      directionDx: dirInfo.dx,
      directionDy: dirInfo.dy
    };
    this.callbacks.onContinuousUpdate?.(update);
  }

  public getCost(itemIndex: number): number {
    const cols = this.surface.getColumns();
    const row = Math.floor(itemIndex / cols);
    const col = itemIndex % cols;

    if (this.technique === 'eight-direction') {
      // Eight-direction: Wait for direction to align, then move to item, then select
      // Approximate: wait for correct direction (avg 4 steps) + distance + 1 click
      const itemCenterX = ((col + 0.5) / cols) * 100;
      const itemCenterY = ((row + 0.5) / Math.ceil(this.surface.getItemsCount() / cols)) * 100;
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
      const yPosition = ((row + 0.5) / Math.ceil(this.surface.getItemsCount() / cols)) * 100;
      const xSteps = Math.round(xPosition / 0.5); // Steps to reach X position
      const ySteps = Math.round(yPosition / 0.5); // Steps to reach Y position
      return xSteps + ySteps + 2; // X scan + Y scan + 2 clicks
    }
  }
}
