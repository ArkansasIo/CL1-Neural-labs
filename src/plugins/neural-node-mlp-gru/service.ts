import { GRUMLPModel, type GRUMLPConfig } from './gru-mlp';
import {
  DEFAULT_NEURAL_NODE_MODEL_CONFIG,
  NEURAL_NODE_MODEL_LIMITS,
  validateModelConfig,
} from './config';
import type { Vector } from './tensor';

export interface NeuralNodeInferenceRequest {
  sequence: Vector[];
  staticFeatures: Vector;
}

/** CPU-only inference facade used by the CL1 simulation plugin. */
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
    if (!request || !Array.isArray(request.sequence)) {
      throw new TypeError('sequence must be an array');
    }
    if (request.sequence.length === 0) {
      throw new RangeError('sequence must contain at least one frame');
    }
    if (request.sequence.length > NEURAL_NODE_MODEL_LIMITS.maxSequenceLength) {
      throw new RangeError('sequence exceeds the maximum supported length');
    }
    return this.model.forward(request.sequence, request.staticFeatures);
  }
}
