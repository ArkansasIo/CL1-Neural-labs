import { assertVector, dot, sigmoid, type Vector } from './tensor';

export type DenseActivation = 'linear' | 'relu' | 'tanh' | 'sigmoid';

export class DenseLayer {
  readonly weights: number[][];
  readonly bias: Vector;

  constructor(
    readonly inputSize: number,
    readonly outputSize: number,
    readonly activation: DenseActivation = 'linear',
    random: () => number = Math.random,
  ) {
    if (!Number.isInteger(inputSize) || !Number.isInteger(outputSize) || inputSize <= 0 || outputSize <= 0) {
      throw new RangeError('layer dimensions must be positive integers');
    }
    const scale = Math.sqrt(2 / inputSize);
    this.weights = Array.from({ length: outputSize }, () =>
      Array.from({ length: inputSize }, () => (random() * 2 - 1) * scale),
    );
    this.bias = new Array(outputSize).fill(0);
  }

  forward(input: Vector): Vector {
    assertVector(input, 'dense input');
    if (input.length !== this.inputSize) throw new RangeError('dense input dimension mismatch');
    return this.weights.map((row, index) => this.activate(dot(row, input) + this.bias[index]!));
  }

  private activate(value: number): number {
    switch (this.activation) {
      case 'relu': return Math.max(0, value);
      case 'tanh': return Math.tanh(value);
      case 'sigmoid': return sigmoid(value);
      default: return value;
    }
  }
}
