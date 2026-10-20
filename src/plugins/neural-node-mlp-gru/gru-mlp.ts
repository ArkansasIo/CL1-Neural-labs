import { assertVector, concat, type Vector } from './tensor';
import { GRU, type GRUConfig } from './gru';
import { MLP } from './mlp';

export interface GRUMLPConfig {
  sequence: GRUConfig;
  staticInputSize: number;
  headHiddenSizes: number[];
  outputSize: number;
}

export class GRUMLPModel {
  readonly encoder: GRU;
  readonly head: MLP;
  readonly staticInputSize: number;

  constructor(config: GRUMLPConfig, random: () => number = Math.random) {
    if (!Number.isInteger(config.staticInputSize) || config.staticInputSize <= 0) {
      throw new RangeError('staticInputSize must be a positive integer');
    }
    this.staticInputSize = config.staticInputSize;
    this.encoder = new GRU(config.sequence, random);
    this.head = new MLP({
      inputSize: config.sequence.hiddenSize + config.staticInputSize,
      hiddenSizes: config.headHiddenSizes,
      outputSize: config.outputSize,
      hiddenActivation: 'relu',
      outputActivation: 'linear',
    }, random);
  }

  forward(sequence: Vector[], staticFeatures: Vector): Vector {
    assertVector(staticFeatures, 'staticFeatures');
    if (staticFeatures.length !== this.staticInputSize) {
      throw new RangeError('static feature dimension mismatch');
    }
    const encoded = this.encoder.forward(sequence);
    return this.head.forward(concat(encoded, staticFeatures));
  }
}
