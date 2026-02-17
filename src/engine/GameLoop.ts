export interface PerformanceMetrics {
  fps: number;
  tps: number;       // ticks per second (actual)
  frameTimeMs: number;
  tickTimeMs: number;
}

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
  private frameBudgetMs: number = 16; // target ~60fps
  private adaptiveMaxTicks: number = 10;

  // Performance tracking
  private _frameCount: number = 0;
  private _tickCount: number = 0;
  private _lastPerfTime: number = 0;
  private _lastTickDuration: number = 0;
  private _lastFrameDelta: number = 16;
  private _perfMetrics: PerformanceMetrics = { fps: 0, tps: 0, frameTimeMs: 0, tickTimeMs: 0 };

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
    this._lastPerfTime = this.lastTime;
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

  get performanceMetrics(): PerformanceMetrics {
    return this._perfMetrics;
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
    this._lastFrameDelta = delta;

    // Cap delta to prevent spiral of death
    if (delta > 250) delta = 250;

    this.accumulator += delta * this.speedMultiplier;

    const dt = this.tickInterval / 1000;
    let ticksThisFrame = 0;
    const maxTicksPerFrame = Math.min(this.adaptiveMaxTicks, Math.max(10, this.speedMultiplier * 2));

    const tickStartTime = performance.now();

    while (this.accumulator >= this.tickInterval && ticksThisFrame < maxTicksPerFrame) {
      this.tickCallback(dt);
      this._tick++;
      this.accumulator -= this.tickInterval;
      ticksThisFrame++;

      // Adaptive: if ticks are taking too long, break early to maintain frame rate
      if (ticksThisFrame > 1 && performance.now() - tickStartTime > this.frameBudgetMs * 0.7) {
        break;
      }
    }

    this._lastTickDuration = performance.now() - tickStartTime;
    this._tickCount += ticksThisFrame;
    this._frameCount++;

    // Update performance metrics every second
    const elapsed = time - this._lastPerfTime;
    if (elapsed >= 1000) {
      this._perfMetrics = {
        fps: Math.round(this._frameCount * 1000 / elapsed),
        tps: Math.round(this._tickCount * 1000 / elapsed),
        frameTimeMs: Math.round(this._lastFrameDelta * 10) / 10,
        tickTimeMs: Math.round(this._lastTickDuration * 10) / 10,
      };
      this._frameCount = 0;
      this._tickCount = 0;
      this._lastPerfTime = time;
    }

    // Adapt max ticks based on actual frame timing
    const tickDuration = this._lastTickDuration;
    if (tickDuration > this.frameBudgetMs * 0.8 && this.adaptiveMaxTicks > 2) {
      this.adaptiveMaxTicks = Math.max(2, this.adaptiveMaxTicks - 1);
    } else if (tickDuration < this.frameBudgetMs * 0.4 && this.adaptiveMaxTicks < 20) {
      this.adaptiveMaxTicks = Math.min(20, this.adaptiveMaxTicks + 1);
    }

    // If still behind, discard accumulated time
    if (this.accumulator >= this.tickInterval * maxTicksPerFrame) {
      this.accumulator = 0;
    }

    const interpolation = this.accumulator / this.tickInterval;
    this.renderCallback(interpolation);
  };
}
