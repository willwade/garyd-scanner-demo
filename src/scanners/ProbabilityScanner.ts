import { Scanner } from './Scanner';
import { SwitchAction } from '../SwitchInput';
import { PredictorManager } from '../PredictorManager';

export class ProbabilityScanner extends Scanner {
  private predictor: PredictorManager;
  private scanOrder: number[] = [];
  private currentIndex: number = -1;

  constructor(renderer: any, config: any, audio: any) {
    super(renderer, config, audio);
    this.predictor = new PredictorManager();
  }

  public start() {
    this.updateProbabilities();
    super.start();
  }

  protected reset() {
    this.currentIndex = -1;
    this.renderer.setFocus([]);
  }

  protected step() {
    this.currentIndex++;
    if (this.currentIndex >= this.scanOrder.length) {
      this.currentIndex = 0;
    }

    const actualIndex = this.scanOrder[this.currentIndex];
    this.renderer.setFocus([actualIndex]);
  }

  public handleAction(action: SwitchAction) {
    if (action === 'select') {
      if (this.currentIndex >= 0) {
        const actualIndex = this.scanOrder[this.currentIndex];
        const item = this.renderer.getItem(actualIndex);
        if (item) {
          this.renderer.setSelected(actualIndex);
          this.triggerSelection(item);

          // Update predictor
          this.predictor.addToContext(item.label.toLowerCase()); // assuming label is char

          // Recalculate probabilities and order
          this.updateProbabilities();

          this.reset();
          if (this.timer) clearTimeout(this.timer);
          this.scheduleNextStep();
        }
      }
    } else if (action === 'cancel') {
        // Maybe clear context?
        // this.predictor.resetContext();
        // this.updateProbabilities();
        this.reset();
    }
  }

  private updateProbabilities() {
    const preds = this.predictor.predictNext();
    // preds is [{text: 'a', probability: 0.5}, ...]

    // Map grid items to probabilities
    const itemsCount = this.renderer.getItemsCount();
    const itemProbs: { index: number, prob: number }[] = [];

    for (let i = 0; i < itemsCount; i++) {
      const item = this.renderer.getItem(i);
      let prob = 0.0001; // Base probability
      if (item && item.label) {
         const p = preds.find((p: any) => p.text.toLowerCase() === item.label.toLowerCase());
         if (p) prob = p.probability;
      }
      itemProbs.push({ index: i, prob });
    }

    // Sort by prob desc
    itemProbs.sort((a, b) => b.prob - a.prob);

    this.scanOrder = itemProbs.map(ip => ip.index);
    // console.log('Scan Order:', this.scanOrder.map(i => this.renderer.getItem(i)?.label).join(''));
  }

  public getCost(itemIndex: number): number {
    const orderIndex = this.scanOrder.indexOf(itemIndex);
    if (orderIndex === -1) return 0; // Or high cost?
    return orderIndex + 1;
  }
}
