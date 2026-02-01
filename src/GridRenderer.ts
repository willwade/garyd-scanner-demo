export interface GridItem {
  id: string;
  label: string;
  image?: string;
  type?: 'action' | 'char' | 'word';
  backgroundColor?: string;
  textColor?: string;
  isEmpty?: boolean; // If true, selecting this item won't trigger output
}

export class GridRenderer {
  private container: HTMLElement;
  private items: GridItem[] = [];
  private elements: HTMLElement[] = [];
  public columns: number = 8;

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

  public setFocus(indices: number[]) {
    // Clear all focus
    this.elements.forEach(el => el.classList.remove('scan-focus'));

    // Add focus to specified indices
    indices.forEach(idx => {
      if (this.elements[idx]) {
        this.elements[idx].classList.add('scan-focus');
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
