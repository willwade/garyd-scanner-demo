export class AudioManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public playBeep(freq: number = 440, duration: number = 0.1, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playScanSound() {
    // Short tick
    this.playBeep(800, 0.05, 'square');
  }

  public playSelectSound() {
    // Higher pitch confirmation
    this.playBeep(1200, 0.1, 'sine');
  }

  public playErrorSound() {
    // Low pitch
    this.playBeep(200, 0.3, 'sawtooth');
  }
}
