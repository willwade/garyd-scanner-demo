import { GridRenderer, GridItem } from '../GridRenderer';
import { ConfigManager } from '../ConfigManager';
import { AudioManager } from '../AudioManager';
import { SwitchAction } from '../SwitchInput';

export abstract class Scanner {
  protected renderer: GridRenderer;
  protected config: ConfigManager;
  protected audio: AudioManager;
  protected isRunning: boolean = false;
  protected timer: number | null = null;

  constructor(renderer: GridRenderer, config: ConfigManager, audio: AudioManager) {
    this.renderer = renderer;
    this.config = config;
    this.audio = audio;
  }

  public start() {
    this.isRunning = true;
    this.reset();
    this.scheduleNextStep();
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.renderer.setFocus([]);
  }

  public abstract handleAction(action: SwitchAction): void;

  protected abstract step(): void;
  protected abstract reset(): void;

  protected scheduleNextStep() {
    if (!this.isRunning) return;
    const rate = this.config.get().scanRate;

    if (this.timer) clearTimeout(this.timer);

    this.timer = window.setTimeout(() => {
      this.step();
      this.audio.playScanSound();
      this.scheduleNextStep();
    }, rate);
  }

  protected triggerSelection(item: GridItem) {
    // Flash selection
    // Dispatch event on the container so it can be scoped
    const event = new CustomEvent('scanner:selection', {
      detail: { item },
      bubbles: true,
      composed: true // Allows crossing shadow boundary if needed (though we listen inside shadow)
    });
    this.renderer.getContainer().dispatchEvent(event);
    this.audio.playSelectSound();
  }

  protected triggerRedraw() {
    const event = new CustomEvent('scanner:redraw', {
        bubbles: true,
        composed: true
    });
    this.renderer.getContainer().dispatchEvent(event);
  }

  public abstract getCost(itemIndex: number): number;

  /**
   * Reorders the linear content to match the visual flow of the scanner.
   * Default implementation returns content as-is (Row-Major).
   */
  public mapContentToGrid(content: GridItem[], rows: number, cols: number): GridItem[] {
      return content;
  }
}
