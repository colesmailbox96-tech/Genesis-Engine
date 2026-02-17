export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

export function tanh_(x: number): number {
  return Math.tanh(x);
}

export function relu(x: number): number {
  return Math.max(0, x);
}

export function gaussian(x: number): number {
  return Math.exp(-x * x);
}

export function sine(x: number): number {
  return Math.sin(x);
}

export function gelu(x: number): number {
  return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
}

export function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map(x => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

export type ActivationType = 'sigmoid' | 'tanh' | 'relu' | 'gaussian' | 'sine';

export function getActivation(type: ActivationType): (x: number) => number {
  switch (type) {
    case 'sigmoid': return sigmoid;
    case 'tanh': return tanh_;
    case 'relu': return relu;
    case 'gaussian': return gaussian;
    case 'sine': return sine;
  }
}
