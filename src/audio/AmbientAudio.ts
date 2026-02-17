export class AmbientAudio {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private baseOscillator: OscillatorNode | null = null;
  private started = false;
  private _volume = 0.3;

  async init(): Promise<void> {
    try {
      this.audioCtx = new AudioContext();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.audioCtx.destination);
    } catch {
      // Audio not available
    }
  }

  start(): void {
    if (this.started || !this.audioCtx || !this.masterGain) return;
    this.started = true;

    // Base hum (30Hz)
    this.baseOscillator = this.audioCtx.createOscillator();
    this.baseOscillator.type = 'sine';
    this.baseOscillator.frequency.value = 30;

    const humGain = this.audioCtx.createGain();
    humGain.gain.value = 0.05;
    this.baseOscillator.connect(humGain);
    humGain.connect(this.masterGain);
    this.baseOscillator.start();
  }

  stop(): void {
    if (!this.started) return;
    this.baseOscillator?.stop();
    this.baseOscillator = null;
    this.started = false;
  }

  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this._volume;
    }
  }

  get volume(): number {
    return this._volume;
  }

  playMilestoneChime(): void {
    if (!this.audioCtx || !this.masterGain) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 1);
  }

  dispose(): void {
    this.stop();
    this.audioCtx?.close();
    this.audioCtx = null;
  }
}
