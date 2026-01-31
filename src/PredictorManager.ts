// @ts-ignore
import { createPredictor } from '@willwade/ppmpredictor';

export interface Prediction {
  text: string;
  probability: number;
}

export class PredictorManager {
  private predictor: any;

  constructor() {
    this.predictor = createPredictor({
      adaptive: true,
      maxOrder: 5
    });
    // Train with some basics
    this.predictor.train('The quick brown fox jumps over the lazy dog. Hello world. How are you?');
  }

  public addToContext(char: string) {
    this.predictor.addToContext(char);
  }

  public resetContext() {
      this.predictor.resetContext();
  }

  public predictNext(): Prediction[] {
    const preds = this.predictor.predictNextCharacter();
    // Normalize or just return
    return preds;
  }
}
