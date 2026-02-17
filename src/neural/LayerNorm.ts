import { Tensor } from './Tensor';

export class LayerNorm {
  size: number;
  gamma: Float32Array;
  beta: Float32Array;
  epsilon: number;

  constructor(size: number, epsilon: number = 1e-5) {
    this.size = size;
    this.gamma = new Float32Array(size).fill(1);
    this.beta = new Float32Array(size).fill(0);
    this.epsilon = epsilon;
  }

  forward(input: Tensor): Tensor {
    const result = new Tensor(input.rows, input.cols);
    for (let r = 0; r < input.rows; r++) {
      let mean = 0;
      for (let c = 0; c < input.cols; c++) mean += input.get(r, c);
      mean /= input.cols;

      let variance = 0;
      for (let c = 0; c < input.cols; c++) {
        const d = input.get(r, c) - mean;
        variance += d * d;
      }
      variance /= input.cols;

      const std = Math.sqrt(variance + this.epsilon);
      for (let c = 0; c < input.cols; c++) {
        result.set(r, c, ((input.get(r, c) - mean) / std) * this.gamma[c] + this.beta[c]);
      }
    }
    return result;
  }
}
