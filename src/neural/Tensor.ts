export class Tensor {
  data: Float32Array;
  rows: number;
  cols: number;

  constructor(rows: number, cols: number, data?: Float32Array) {
    this.rows = rows;
    this.cols = cols;
    this.data = data || new Float32Array(rows * cols);
  }

  static zeros(rows: number, cols: number): Tensor {
    return new Tensor(rows, cols);
  }

  static fromArray(arr: number[]): Tensor {
    const t = new Tensor(1, arr.length);
    t.data.set(arr);
    return t;
  }

  get(r: number, c: number): number { return this.data[r * this.cols + c]; }
  set(r: number, c: number, v: number): void { this.data[r * this.cols + c] = v; }

  matmul(other: Tensor): Tensor {
    const result = new Tensor(this.rows, other.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) {
          sum += this.get(i, k) * other.get(k, j);
        }
        result.set(i, j, sum);
      }
    }
    return result;
  }

  add(other: Tensor): Tensor {
    const result = new Tensor(this.rows, this.cols);
    for (let i = 0; i < this.data.length; i++) {
      result.data[i] = this.data[i] + other.data[i];
    }
    return result;
  }

  apply(fn: (v: number) => number): Tensor {
    const result = new Tensor(this.rows, this.cols);
    for (let i = 0; i < this.data.length; i++) {
      result.data[i] = fn(this.data[i]);
    }
    return result;
  }

  toArray(): number[] {
    return Array.from(this.data);
  }
}
