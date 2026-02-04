export interface GridItem {
  id: string;
  label: string;
  image?: string;
  type?: 'action' | 'char' | 'word';
  message?: string;
  targetPageId?: string;
  scanBlock?: number;
  backgroundColor?: string;
  textColor?: string;
  isEmpty?: boolean; // If true, selecting this item won't trigger output
}

export class GridRenderer {
  private container: HTMLElement;
  private items: GridItem[] = [];
  private elements: HTMLElement[] = [];
  public columns: number = 8;
  private highlightConfig: { highlightBorderWidth: number; highlightBorderColor: string; highlightScale: number; highlightOpacity: number; highlightAnimation: boolean; highlightScanLine?: boolean; scanDirection?: string; scanPattern?: string; scanRate?: number } | null = null;

  constructor(container: HTMLElement | string) {
    if (typeof container === 'string') {
      const el = document.getElementById(container);
      if (!el) throw new Error(`Container ${container} not found`);
      this.container = el;
    } else {
      this.container = container;
    }
  }

  public getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * Update highlight visualization styles based on config
   * Sets CSS custom properties for border, scale, opacity, and animation
   */
  public updateHighlightStyles(config: { highlightBorderWidth: number; highlightBorderColor: string; highlightScale: number; highlightOpacity: number; highlightAnimation: boolean; highlightScanLine?: boolean; scanDirection?: string; scanPattern?: string; scanRate?: number }) {
    this.highlightConfig = config;
    // Set CSS custom properties on the container
    const borderWidth = config.highlightScanLine ? 0 : config.highlightBorderWidth;
    this.container.style.setProperty('--focus-border-width', `${borderWidth}px`);
    this.container.style.setProperty('--focus-color', config.highlightBorderColor);
    this.container.style.setProperty('--focus-scale', config.highlightScale.toString());
    this.container.style.setProperty('--focus-opacity', config.highlightOpacity.toString());
    this.container.style.setProperty('--focus-animation', config.highlightAnimation ? 'pulse' : 'none');
    this.container.style.setProperty('--scan-line-enabled', config.highlightScanLine ? '1' : '0');
    const orientation = config.scanPattern === 'column-row' ? 'vertical' : 'horizontal';
    this.container.style.setProperty('--scan-line-orientation', orientation);
    const direction = config.scanDirection === 'reverse' ? 'reverse' : 'forward';
    this.container.style.setProperty('--scan-line-direction', direction);
    if (config.scanRate) {
      this.container.style.setProperty('--scan-line-duration', `${config.scanRate}ms`);
    }
  }

  public render(items: GridItem[], columns: number = 8) {
    this.items = items;
    this.columns = columns;
    this.container.innerHTML = '';
    this.elements = [];

    // Update grid layout
    this.container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

    items.forEach((item, index) => {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';

      if (item.image) {
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.label;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        cell.appendChild(img);

        if (item.label) {
          const span = document.createElement('span');
          span.textContent = item.label;
          span.style.marginTop = '5px';
          cell.appendChild(span);
          cell.style.flexDirection = 'column';
        }
      } else {
        cell.textContent = item.label;
      }

      cell.dataset.index = index.toString();
      cell.dataset.id = item.id;

      if (item.backgroundColor) {
        cell.style.backgroundColor = item.backgroundColor;
      }
      if (item.textColor) {
        cell.style.color = item.textColor;
      }

      this.container.appendChild(cell);
      this.elements.push(cell);
    });
  }

  public setFocus(
    indices: number[],
    config?: {
      highlightBorderWidth: number;
      highlightBorderColor: string;
      highlightScale: number;
      highlightOpacity: number;
      highlightAnimation: boolean;
      highlightScanLine?: boolean;
      scanDirection?: string;
      scanPattern?: string;
      scanRate?: number;
    },
    _meta?: import('scan-engine').FocusMeta
  ) {
    const effectiveConfig = config ?? this.highlightConfig ?? undefined;
    // Update styles if config provided
    if (config) {
      this.updateHighlightStyles(config);
    }

    // Clear all focus
    this.elements.forEach(el => {
      el.classList.remove('scan-focus');
      el.classList.remove('animate-pulse');
      el.classList.remove('scan-line-vertical');
      el.classList.remove('scan-line-reverse');
      el.classList.remove('scan-line-only');
      el.style.removeProperty('--scan-line-duration');
      el.style.removeProperty('--scan-line-delay');
    });

    const perCellDuration = effectiveConfig?.scanRate && indices.length > 0
      ? Math.max(100, Math.floor(effectiveConfig.scanRate / indices.length))
      : undefined;

    // Add focus to specified indices
    indices.forEach((idx, order) => {
      if (this.elements[idx]) {
        const el = this.elements[idx];
        el.classList.add('scan-focus');

        // Add animation class if enabled
        if (effectiveConfig?.highlightAnimation) {
          el.classList.add('animate-pulse');
        }

        if (effectiveConfig?.highlightScanLine) {
          el.classList.add('scan-line-only');
          if (effectiveConfig?.scanPattern === 'column-row') {
            el.classList.add('scan-line-vertical');
          }
          if (effectiveConfig?.scanDirection === 'reverse') {
            el.classList.add('scan-line-reverse');
          }
          if (perCellDuration) {
            el.style.setProperty('--scan-line-duration', `${perCellDuration}ms`);
            el.style.setProperty('--scan-line-delay', `${order * perCellDuration}ms`);
          }
        }
      }
    });
  }

  public setSelected(index: number) {
    if (this.elements[index]) {
      const el = this.elements[index];
      el.classList.add('selected');
      // Remove class after animation
      setTimeout(() => el.classList.remove('selected'), 500);
    }
  }

  public getElement(index: number): HTMLElement | undefined {
    return this.elements[index];
  }

  public getItem(index: number): GridItem | undefined {
    return this.items[index];
  }

  public getItemsCount(): number {
    return this.items.length;
  }
}
