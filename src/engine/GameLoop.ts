export class GameLoop {
  private tickCallback: (dt: number) => void;
  private renderCallback: (interpolation: number) => void;
  private tickRate: number;
  private tickInterval: number;
  private accumulator: number = 0;
  private lastTime: number = 0;
  private running: boolean = false;
  private speedMultiplier: number = 1;
  private animFrameId: number = 0;
  private _tick: number = 0;

  constructor(
    tickRate: number,
    tickCallback: (dt: number) => void,
    renderCallback: (interpolation: number) => void
  ) {
    this.tickRate = tickRate;
    this.tickInterval = 1000 / tickRate;
    this.tickCallback = tickCallback;
    this.renderCallback = renderCallback;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  setSpeed(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  get tick(): number {
    return this._tick;
  }

  get isRunning(): boolean {
    return this.running;
  }

  // Run N ticks synchronously without rendering (for epoch skip)
  skipTicks(count: number): void {
    const dt = this.tickInterval / 1000;
    for (let i = 0; i < count; i++) {
      this.tickCallback(dt);
      this._tick++;
    }
  }

  private loop = (time: number): void => {
    if (!this.running) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    let delta = time - this.lastTime;
    this.lastTime = time;

    // Cap delta to prevent spiral of death
    if (delta > 250) delta = 250;

    this.accumulator += delta * this.speedMultiplier;

    const dt = this.tickInterval / 1000;
    let ticksThisFrame = 0;
    const maxTicksPerFrame = Math.max(10, this.speedMultiplier * 2);

    while (this.accumulator >= this.tickInterval && ticksThisFrame < maxTicksPerFrame) {
      this.tickCallback(dt);
      this._tick++;
      this.accumulator -= this.tickInterval;
      ticksThisFrame++;
    }

    // If still behind, discard accumulated time
    if (this.accumulator >= this.tickInterval * maxTicksPerFrame) {
      this.accumulator = 0;
    }

    const interpolation = this.accumulator / this.tickInterval;
    this.renderCallback(interpolation);
  };
}
