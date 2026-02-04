import type { ContinuousUpdate } from 'scan-engine';

export class ContinuousOverlay {
  private overlay: HTMLElement;
  private hBar: HTMLElement;
  private vBar: HTMLElement;
  private bufferZone: HTMLElement;
  private lockedXBar: HTMLElement;
  private directionIndicator: HTMLElement;
  private directionLine: HTMLElement;

  constructor(private container: HTMLElement) {
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100%';
    this.overlay.style.height = '100%';
    this.overlay.style.pointerEvents = 'none';
    this.overlay.style.zIndex = '1000';

    this.bufferZone = document.createElement('div');
    this.bufferZone.style.position = 'absolute';
    this.bufferZone.style.top = '0';
    this.bufferZone.style.height = '100%';
    this.bufferZone.style.backgroundColor = 'rgba(128, 128, 128, 0.4)';
    this.bufferZone.style.borderLeft = '2px solid rgba(128, 128, 128, 0.8)';
    this.bufferZone.style.borderRight = '2px solid rgba(128, 128, 128, 0.8)';
    this.bufferZone.style.pointerEvents = 'none';
    this.bufferZone.style.display = 'none';
    this.overlay.appendChild(this.bufferZone);

    this.vBar = document.createElement('div');
    this.vBar.style.position = 'absolute';
    this.vBar.style.top = '0';
    this.vBar.style.width = '4px';
    this.vBar.style.height = '100%';
    this.vBar.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    this.vBar.style.borderLeft = '1px solid red';
    this.vBar.style.borderRight = '1px solid red';
    this.vBar.style.display = 'none';
    this.overlay.appendChild(this.vBar);

    this.hBar = document.createElement('div');
    this.hBar.style.position = 'absolute';
    this.hBar.style.left = '0';
    this.hBar.style.width = '100%';
    this.hBar.style.height = '4px';
    this.hBar.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    this.hBar.style.borderTop = '1px solid red';
    this.hBar.style.borderBottom = '1px solid red';
    this.hBar.style.display = 'none';
    this.overlay.appendChild(this.hBar);

    this.lockedXBar = document.createElement('div');
    this.lockedXBar.style.position = 'absolute';
    this.lockedXBar.style.top = '0';
    this.lockedXBar.style.width = '3px';
    this.lockedXBar.style.height = '100%';
    this.lockedXBar.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
    this.lockedXBar.style.borderLeft = '1px solid green';
    this.lockedXBar.style.borderRight = '1px solid green';
    this.lockedXBar.style.display = 'none';
    this.overlay.appendChild(this.lockedXBar);

    this.directionIndicator = document.createElement('div');
    this.directionIndicator.style.position = 'absolute';
    this.directionIndicator.style.top = '10px';
    this.directionIndicator.style.right = '10px';
    this.directionIndicator.style.width = '80px';
    this.directionIndicator.style.height = '80px';
    this.directionIndicator.style.borderRadius = '50%';
    this.directionIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    this.directionIndicator.style.border = '3px solid #333';
    this.directionIndicator.style.display = 'none';
    this.directionIndicator.style.pointerEvents = 'none';
    this.overlay.appendChild(this.directionIndicator);

    this.directionLine = document.createElement('div');
    this.directionLine.style.position = 'absolute';
    this.directionLine.style.height = '2px';
    this.directionLine.style.backgroundColor = 'rgba(33, 150, 243, 0.6)';
    this.directionLine.style.transformOrigin = '0 50%';
    this.directionLine.style.display = 'none';
    this.directionLine.style.pointerEvents = 'none';
    this.directionLine.style.zIndex = '5';
    this.overlay.appendChild(this.directionLine);

    this.container.appendChild(this.overlay);
  }

  destroy() {
    if (this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }

  update(state: ContinuousUpdate) {
    if (state.technique === 'eight-direction') {
      this.vBar.style.display = 'none';
      this.hBar.style.display = 'none';
      this.bufferZone.style.display = 'none';
      this.lockedXBar.style.display = 'none';

      this.directionIndicator.style.display = 'block';
      this.directionLine.style.display = 'block';

      const angle = state.compassAngle;

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
        ">${state.directionName} (${Math.round(angle)}°)</div>
      `;

      this.directionLine.style.left = `${state.xPos}%`;
      this.directionLine.style.top = `${state.yPos}%`;
      const lineLength = this.calculateLineLength(state.xPos, state.yPos, state.directionDx, state.directionDy);
      this.directionLine.style.width = `${lineLength}%`;
      this.directionLine.style.transformOrigin = '0 50%';
      this.directionLine.style.transform = `rotate(${angle}deg)`;

      this.vBar.style.display = 'block';
      this.vBar.style.width = '12px';
      this.vBar.style.height = '12px';
      this.vBar.style.borderRadius = '50%';
      this.vBar.style.backgroundColor = state.state === 'moving' ? '#FF5722' : '#2196F3';
      this.vBar.style.border = '2px solid white';
      this.vBar.style.zIndex = '10';
      this.vBar.style.left = `calc(${state.xPos}% - 6px)`;
      this.vBar.style.top = `calc(${state.yPos}% - 6px)`;
      return;
    }

    if (state.technique === 'gliding') {
      if (state.state === 'x-scanning') {
        this.vBar.style.display = 'none';
        this.hBar.style.display = 'none';
        this.lockedXBar.style.display = 'none';
        this.directionIndicator.style.display = 'none';
        this.directionLine.style.display = 'none';

        const actualWidth = state.bufferRight - state.bufferLeft;

        this.bufferZone.style.left = `${state.bufferLeft}%`;
        this.bufferZone.style.width = `${actualWidth}%`;
        this.bufferZone.style.height = '100%';
        this.bufferZone.style.top = '0';
        this.bufferZone.style.display = 'block';
      } else if (state.state === 'x-capturing') {
        this.hBar.style.display = 'none';
        this.lockedXBar.style.display = 'none';
        this.directionIndicator.style.display = 'none';
        this.directionLine.style.display = 'none';

        const actualWidth = state.bufferRight - state.bufferLeft;
        this.bufferZone.style.left = `${state.bufferLeft}%`;
        this.bufferZone.style.width = `${actualWidth}%`;
        this.bufferZone.style.height = '100%';
        this.bufferZone.style.top = '0';
        this.bufferZone.style.display = 'block';

        const actualXPos = state.bufferLeft + (state.fineXPos / 100) * (state.bufferRight - state.bufferLeft);
        this.vBar.style.display = 'block';
        this.vBar.style.left = `${actualXPos}%`;
      } else if (state.state === 'y-scanning') {
        this.vBar.style.display = 'none';
        this.hBar.style.display = 'none';
        this.directionIndicator.style.display = 'none';
        this.directionLine.style.display = 'none';

        this.lockedXBar.style.display = 'block';
        this.lockedXBar.style.left = `${state.lockedXPosition}%`;

        const actualHeight = state.bufferBottom - state.bufferTop;

        this.bufferZone.style.left = '0';
        this.bufferZone.style.width = '100%';
        this.bufferZone.style.top = `${state.bufferTop}%`;
        this.bufferZone.style.height = `${actualHeight}%`;
        this.bufferZone.style.display = 'block';
      } else if (state.state === 'y-capturing') {
        this.vBar.style.display = 'none';
        this.directionIndicator.style.display = 'none';
        this.directionLine.style.display = 'none';

        this.lockedXBar.style.display = 'block';
        this.lockedXBar.style.left = `${state.lockedXPosition}%`;

        const actualHeight = state.bufferBottom - state.bufferTop;
        this.bufferZone.style.left = '0';
        this.bufferZone.style.width = '100%';
        this.bufferZone.style.top = `${state.bufferTop}%`;
        this.bufferZone.style.height = `${actualHeight}%`;
        this.bufferZone.style.display = 'block';

        const actualYPos = state.bufferTop + (state.fineYPos / 100) * (state.bufferBottom - state.bufferTop);
        this.hBar.style.display = 'block';
        this.hBar.style.top = `${actualYPos}%`;
      }
      return;
    }

    this.bufferZone.style.display = 'none';
    this.lockedXBar.style.display = 'none';
    this.directionIndicator.style.display = 'none';
    this.directionLine.style.display = 'none';

    if (state.state === 'x-scan') {
      this.vBar.style.display = 'block';
      this.vBar.style.left = `${state.xPos}%`;
      this.hBar.style.display = 'none';
    } else if (state.state === 'y-scan') {
      this.vBar.style.display = 'block';
      this.vBar.style.left = `${state.xPos}%`;
      this.hBar.style.display = 'block';
      this.hBar.style.top = `${state.yPos}%`;
    }
  }

  private calculateLineLength(x: number, y: number, dx: number, dy: number): number {
    if (dx === 0 && dy === -1) {
      return y;
    } else if (dx === 1 && dy === -1) {
      return Math.min(100 - x, y) * Math.SQRT2;
    } else if (dx === 1 && dy === 0) {
      return 100 - x;
    } else if (dx === 1 && dy === 1) {
      return Math.min(100 - x, 100 - y) * Math.SQRT2;
    } else if (dx === 0 && dy === 1) {
      return 100 - y;
    } else if (dx === -1 && dy === 1) {
      return Math.min(x, 100 - y) * Math.SQRT2;
    } else if (dx === -1 && dy === 0) {
      return x;
    } else if (dx === -1 && dy === -1) {
      return Math.min(x, y) * Math.SQRT2;
    }
    return 50;
  }
}

export function resolveIndexAtPoint(container: HTMLElement, xPercent: number, yPercent: number): number | null {
  const rect = container.getBoundingClientRect();
  const clientX = rect.left + (xPercent / 100) * rect.width;
  const clientY = rect.top + (yPercent / 100) * rect.height;
  const root = container.getRootNode() as Document | ShadowRoot;
  const element = root.elementFromPoint ? root.elementFromPoint(clientX, clientY) : document.elementFromPoint(clientX, clientY);
  if (!element) return null;
  const gridCell = (element as HTMLElement).closest('.grid-cell') as HTMLElement | null;
  if (!gridCell || !gridCell.dataset.index) return null;
  const index = parseInt(gridCell.dataset.index, 10);
  return Number.isNaN(index) ? null : index;
}
