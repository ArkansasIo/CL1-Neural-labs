import type { GRUMLPConfig } from './gru-mlp';

/** Default CPU-safe model configuration for simulated neural data. */
export const DEFAULT_NEURAL_NODE_MODEL_CONFIG: GRUMLPConfig = {
  sequence: {
    inputSize: 16,
    hiddenSize: 32,
  },
  staticInputSize: 8,
  headHiddenSizes: [32, 16],
  outputSize: 4,
};

export const NEURAL_NODE_MODEL_LIMITS = {
  maxSequenceLength: 4096,
  maxInputSize: 1024,
  maxHiddenSize: 2048,
  maxOutputSize: 1024,
} as const;

export function validateModelConfig(config: GRUMLPConfig): void {
  if (config.sequence.inputSize > NEURAL_NODE_MODEL_LIMITS.maxInputSize) {
    throw new RangeError('sequence input size exceeds the plugin safety limit');
  }
  if (config.sequence.hiddenSize > NEURAL_NODE_MODEL_LIMITS.maxHiddenSize) {
    throw new RangeError('GRU hidden size exceeds the plugin safety limit');
  }
  if (config.outputSize > NEURAL_NODE_MODEL_LIMITS.maxOutputSize) {
    throw new RangeError('output size exceeds the plugin safety limit');
  }
  if (config.headHiddenSizes.some((size) => size > NEURAL_NODE_MODEL_LIMITS.maxHiddenSize)) {
    throw new RangeError('MLP hidden size exceeds the plugin safety limit');
  }
}
