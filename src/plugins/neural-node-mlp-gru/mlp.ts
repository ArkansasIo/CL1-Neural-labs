import { assertVector, type Vector } from './tensor';
import { DenseLayer, type DenseActivation } from './dense';

export interface MLPConfig {
  inputSize: number;
  hiddenSizes: number[];
  outputSize: number;
  hiddenActivation?: DenseActivation;
  outputActivation?: DenseActivation;
}

export class MLP {
  readonly layers: DenseLayer[];

  constructor(config: MLPConfig, random: () => number = Math.random) {
    if (!Number.isInteger(config.inputSize) || config.inputSize <= 0 ||
        !Number.isInteger(config.outputSize) || config.outputSize <= 0 ||
        config.hiddenSizes.some((size) => !Number.isInteger(size) || size <= 0)) {
      throw new RangeError('MLP sizes must be positive integers');
    }
    const sizes = [config.inputSize, ...config.hiddenSizes, config.outputSize];
    this.layers = sizes.slice(0, -1).map((size, index) =>
      new DenseLayer(
        size,
        sizes[index + 1]!,
        index === sizes.length - 2 ? (config.outputActivation ?? 'linear') : (config.hiddenActivation ?? 'relu'),
        random,
      ),
    );
  }

  forward(input: Vector): Vector {
    assertVector(input, 'MLP input');
    return this.layers.reduce((result, layer) => layer.forward(result), input);
  }
}
