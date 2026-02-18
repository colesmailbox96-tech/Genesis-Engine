import { Vector2 } from '../utils/Vector2';

export class ChemicalField {
  private readonly gridSize: number;
  private readonly worldSize: number;
  private readonly cellSize: number;
  readonly concentrations: Map<string, Float32Array>;
  private scratchBuffer: Float32Array;

  constructor(worldSize: number = 512, gridSize: number = 64) {
    this.worldSize = worldSize;
    this.gridSize = gridSize;
    this.cellSize = worldSize / gridSize;
    this.concentrations = new Map();
    this.scratchBuffer = new Float32Array(gridSize * gridSize);
  }

  private ensureType(type: string): Float32Array {
    let grid = this.concentrations.get(type);
    if (!grid) {
      grid = new Float32Array(this.gridSize * this.gridSize);
      this.concentrations.set(type, grid);
    }
    return grid;
  }

  private toGrid(worldX: number, worldY: number): [number, number] {
    const gx = Math.floor(worldX / this.cellSize);
    const gy = Math.floor(worldY / this.cellSize);
    return [
      Math.max(0, Math.min(this.gridSize - 1, gx)),
      Math.max(0, Math.min(this.gridSize - 1, gy)),
    ];
  }

  private idx(gx: number, gy: number): number {
    return gy * this.gridSize + gx;
  }

  addSource(x: number, y: number, type: string, amount: number): void {
    const grid = this.ensureType(type);
    const [gx, gy] = this.toGrid(x, y);
    grid[this.idx(gx, gy)] += amount;
  }

  getConcentration(x: number, y: number, type: string): number {
    const grid = this.concentrations.get(type);
    if (!grid) return 0;
    const [gx, gy] = this.toGrid(x, y);
    return grid[this.idx(gx, gy)];
  }

  getGradient(x: number, y: number, type: string): Vector2 {
    const grid = this.concentrations.get(type);
    if (!grid) return Vector2.zero();
    const [gx, gy] = this.toGrid(x, y);

    const left = gx > 0 ? grid[this.idx(gx - 1, gy)] : 0;
    const right = gx < this.gridSize - 1 ? grid[this.idx(gx + 1, gy)] : 0;
    const up = gy > 0 ? grid[this.idx(gx, gy - 1)] : 0;
    const down = gy < this.gridSize - 1 ? grid[this.idx(gx, gy + 1)] : 0;

    return new Vector2(right - left, down - up);
  }

  diffuse(rate: number): void {
    const next = this.scratchBuffer;
    for (const [, grid] of this.concentrations) {
      next.fill(0);
      for (let gy = 0; gy < this.gridSize; gy++) {
        for (let gx = 0; gx < this.gridSize; gx++) {
          const i = this.idx(gx, gy);
          let sum = 0;
          let count = 0;
          if (gx > 0) { sum += grid[this.idx(gx - 1, gy)]; count++; }
          if (gx < this.gridSize - 1) { sum += grid[this.idx(gx + 1, gy)]; count++; }
          if (gy > 0) { sum += grid[this.idx(gx, gy - 1)]; count++; }
          if (gy < this.gridSize - 1) { sum += grid[this.idx(gx, gy + 1)]; count++; }
          const avg = count > 0 ? sum / count : 0;
          next[i] = grid[i] + rate * (avg - grid[i]);
        }
      }
      // Copy back
      grid.set(next);
    }
  }

  advect(flowField: (gx: number, gy: number) => Vector2): void {
    const next = this.scratchBuffer;
    for (const [, grid] of this.concentrations) {
      next.fill(0);
      for (let gy = 0; gy < this.gridSize; gy++) {
        for (let gx = 0; gx < this.gridSize; gx++) {
          const flow = flowField(gx, gy);
          // Trace back to source
          const srcX = Math.max(0, Math.min(this.gridSize - 1, gx - flow.x));
          const srcY = Math.max(0, Math.min(this.gridSize - 1, gy - flow.y));
          const sx = Math.floor(srcX);
          const sy = Math.floor(srcY);
          next[this.idx(gx, gy)] = grid[this.idx(sx, sy)];
        }
      }
      grid.set(next);
    }
  }

  tick(): void {
    this.diffuse(0.1);
  }

  tickWithViscosity(viscosityMap: Float32Array): void {
    const next = this.scratchBuffer;
    for (const [, grid] of this.concentrations) {
      next.fill(0);
      for (let gy = 0; gy < this.gridSize; gy++) {
        for (let gx = 0; gx < this.gridSize; gx++) {
          const i = this.idx(gx, gy);
          const visc = Math.max(0, Math.min(1, viscosityMap[i]));
          const rate = 0.1 * visc;
          let sum = 0;
          let count = 0;
          if (gx > 0) { sum += grid[this.idx(gx - 1, gy)]; count++; }
          if (gx < this.gridSize - 1) { sum += grid[this.idx(gx + 1, gy)]; count++; }
          if (gy > 0) { sum += grid[this.idx(gx, gy - 1)]; count++; }
          if (gy < this.gridSize - 1) { sum += grid[this.idx(gx, gy + 1)]; count++; }
          const avg = count > 0 ? sum / count : 0;
          next[i] = grid[i] + rate * (avg - grid[i]);
        }
      }
      grid.set(next);
    }
  }

  applySurfaceAdsorption(surfaceMap: Float32Array, rate: number = 0.05): void {
    const decayFactor = 1 - rate;
    for (const [, grid] of this.concentrations) {
      for (let gy = 0; gy < this.gridSize; gy++) {
        for (let gx = 0; gx < this.gridSize; gx++) {
          const i = this.idx(gx, gy);
          if (surfaceMap[i] > 0.5) {
            const adsorbed = grid[i] * surfaceMap[i] * rate * 0.1;
            this.addSource(gx * this.cellSize, gy * this.cellSize, 'surface_adsorbed', adsorbed);
            grid[i] *= decayFactor;
          }
        }
      }
    }
  }
}
