import { Scanner } from './Scanner';
import { GridRenderer } from '../GridRenderer';
import { ConfigManager } from '../ConfigManager';
import { AudioManager } from '../AudioManager';
import { SwitchAction } from '../SwitchInput';

type ColorCodeColor = 'red' | 'blue';

export class ColorCodeScanner extends Scanner {
  private probabilities: number[] = [];
  private colors: ColorCodeColor[] = [];

  constructor(renderer: GridRenderer, config: ConfigManager, audio: AudioManager) {
    super(renderer, config, audio);
  }

  public start() {
    this.isRunning = true;
    this.initializeBelief();
    this.assignColors();
    this.applyColors();
  }

  public stop() {
    this.isRunning = false;
    this.renderer.setFocus([]);
  }

  public handleAction(action: SwitchAction): void {
    if (!this.isRunning) return;

    let clicked: ColorCodeColor | null = null;
    if (action === 'switch-1' || action === 'select') {
      clicked = 'blue';
    } else if (action === 'switch-2' || action === 'step') {
      clicked = 'red';
    } else if (action === 'reset') {
      this.initializeBelief();
      this.assignColors();
      this.applyColors();
      return;
    } else {
      return;
    }

    this.updateBelief(clicked);
    this.assignColors();
    this.applyColors();
  }

  protected step(): void {
    // No timed stepping in ColorCode
  }

  protected reset(): void {
    this.initializeBelief();
    this.assignColors();
    this.applyColors();
  }

  public getCost(_itemIndex: number): number {
    return 1;
  }

  protected doSelection(): void {
    // Selection is handled when the belief passes the threshold
  }

  private initializeBelief() {
    const count = this.renderer.getItemsCount();
    const value = count > 0 ? 1 / count : 0;
    this.probabilities = new Array(count).fill(value);
  }

  private assignColors() {
    const indices = this.probabilities
      .map((p, i) => ({ p, i }))
      .sort((a, b) => b.p - a.p);

    let redSum = 0;
    let blueSum = 0;
    this.colors = new Array(this.probabilities.length).fill('blue');

    for (const entry of indices) {
      if (redSum <= blueSum) {
        this.colors[entry.i] = 'red';
        redSum += entry.p;
      } else {
        this.colors[entry.i] = 'blue';
        blueSum += entry.p;
      }
    }
  }

  private applyColors() {
    const redColor = '#f9c6c6';
    const blueColor = '#cfe3ff';
    for (let i = 0; i < this.colors.length; i++) {
      const el = this.renderer.getElement(i);
      if (!el) continue;
      el.style.backgroundColor = this.colors[i] === 'red' ? redColor : blueColor;
      el.style.color = '#1e1e1e';
    }
  }

  private updateBelief(clicked: ColorCodeColor) {
    const { errorRate, selectThreshold } = this.config.get().colorCode;
    const correctProb = 1 - errorRate;
    let sum = 0;

    for (let i = 0; i < this.probabilities.length; i++) {
      const isMatch = this.colors[i] === clicked;
      const likelihood = isMatch ? correctProb : errorRate;
      this.probabilities[i] *= likelihood;
      sum += this.probabilities[i];
    }

    if (sum > 0) {
      for (let i = 0; i < this.probabilities.length; i++) {
        this.probabilities[i] /= sum;
      }
    }

    let maxIndex = 0;
    for (let i = 1; i < this.probabilities.length; i++) {
      if (this.probabilities[i] > this.probabilities[maxIndex]) {
        maxIndex = i;
      }
    }

    if (this.probabilities[maxIndex] >= selectThreshold) {
      const item = this.renderer.getItem(maxIndex);
      if (item) {
        this.renderer.setSelected(maxIndex);
        this.triggerSelection(item);
      }
      this.initializeBelief();
    }
  }
}
