import { Tensor } from './Tensor';

export class LinearLayer {
  weights: Tensor;
  bias: Tensor;

  constructor(inputSize: number, outputSize: number) {
    this.weights = Tensor.zeros(inputSize, outputSize);
    this.bias = Tensor.zeros(1, outputSize);
  }

  forward(input: Tensor): Tensor {
    return input.matmul(this.weights).add(this.bias);
  }
}
