import { Vector2 } from '../utils/Vector2';

export interface SpatialEntity {
  id: string;
  position: Vector2;
}

export class SpatialHash<T extends SpatialEntity> {
  private cellSize: number;
  private cells: Map<number, T[]> = new Map();
  private entityCells: Map<string, number> = new Map();
  private _queryBuffer: T[] = [];

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private hash(x: number, y: number): number {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return cx * 73856093 + cy * 19349663;
  }

  clear(): void {
    this.cells.clear();
    this.entityCells.clear();
  }

  insert(entity: T): void {
    const key = this.hash(entity.position.x, entity.position.y);
    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    cell.push(entity);
    this.entityCells.set(entity.id, key);
  }

  remove(entity: T): void {
    const key = this.entityCells.get(entity.id);
    if (key !== undefined) {
      const cell = this.cells.get(key);
      if (cell) {
        const idx = cell.indexOf(entity);
        if (idx !== -1) cell.splice(idx, 1);
        if (cell.length === 0) this.cells.delete(key);
      }
      this.entityCells.delete(entity.id);
    }
  }

  query(x: number, y: number, radius: number): T[] {
    const results: T[] = [];
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    const radiusSq = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = cx * 73856093 + cy * 19349663;
        const cell = this.cells.get(key);
        if (cell) {
          for (const entity of cell) {
            const dx = entity.position.x - x;
            const dy = entity.position.y - y;
            if (dx * dx + dy * dy <= radiusSq) {
              results.push(entity);
            }
          }
        }
      }
    }
    return results;
  }

  /** Reusable-buffer query that avoids allocating a new array each call.
   *  The returned array is reused on the next call — copy it if you need to keep it. */
  queryReuse(x: number, y: number, radius: number): readonly T[] {
    const buf = this._queryBuffer;
    buf.length = 0;
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    const radiusSq = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = cx * 73856093 + cy * 19349663;
        const cell = this.cells.get(key);
        if (cell) {
          for (const entity of cell) {
            const dx = entity.position.x - x;
            const dy = entity.position.y - y;
            if (dx * dx + dy * dy <= radiusSq) {
              buf.push(entity);
            }
          }
        }
      }
    }
    return buf;
  }

  queryRect(x: number, y: number, w: number, h: number): T[] {
    const results: T[] = [];
    const minCx = Math.floor(x / this.cellSize);
    const maxCx = Math.floor((x + w) / this.cellSize);
    const minCy = Math.floor(y / this.cellSize);
    const maxCy = Math.floor((y + h) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = cx * 73856093 + cy * 19349663;
        const cell = this.cells.get(key);
        if (cell) {
          for (const entity of cell) {
            if (entity.position.x >= x && entity.position.x <= x + w &&
                entity.position.y >= y && entity.position.y <= y + h) {
              results.push(entity);
            }
          }
        }
      }
    }
    return results;
  }

  getAll(): T[] {
    const results: T[] = [];
    for (const cell of this.cells.values()) {
      results.push(...cell);
    }
    return results;
  }

  get size(): number {
    let count = 0;
    for (const cell of this.cells.values()) {
      count += cell.length;
    }
    return count;
  }
}
