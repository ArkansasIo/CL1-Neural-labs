import { GRUMLPModel, type GRUMLPConfig } from './gru-mlp';
import { DEFAULT_NEURAL_NODE_MODEL_CONFIG, validateModelConfig } from './config';
import type { Vector } from './tensor';

export interface NeuralNodeInferenceRequest {
  sequence: Vector[];
  staticFeatures: Vector;
}

export class NeuralNodeInferenceService {
  readonly model: GRUMLPModel;

  constructor(
    config: GRUMLPConfig = DEFAULT_NEURAL_NODE_MODEL_CONFIG,
    random: () => number = Math.random,
  ) {
    validateModelConfig(config);
    this.model = new GRUMLPModel(config, random);
  }

  infer(request: NeuralNodeInferenceRequest): Vector {
    if (request.sequence.length > 4096) {
      throw new RangeError('sequence exceeds the maximum supported length');
    }
    return this.model.forward(request.sequence, request.staticFeatures);
  }
}
