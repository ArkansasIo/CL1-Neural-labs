import test from 'node:test';
import assert from 'node:assert/strict';
import { NeuralNodeInferenceService, DEFAULT_NEURAL_NODE_MODEL_CONFIG } from '../src/plugins/neural-node-mlp-gru/index.ts';

const deterministicRandom = () => 0.5;
const frame = () => Array(DEFAULT_NEURAL_NODE_MODEL_CONFIG.sequence.inputSize).fill(0.25);
const staticFeatures = Array(DEFAULT_NEURAL_NODE_MODEL_CONFIG.staticInputSize).fill(0.1);

test('Neural Node service executes deterministic GRU-MLP inference', () => {
  const service = new NeuralNodeInferenceService(DEFAULT_NEURAL_NODE_MODEL_CONFIG, deterministicRandom);
  const output = service.infer({ sequence: [frame(), frame()], staticFeatures });

  assert.equal(output.length, DEFAULT_NEURAL_NODE_MODEL_CONFIG.outputSize);
  assert.ok(output.every(Number.isFinite));
});

test('Neural Node service rejects empty and oversized sequences', () => {
  const service = new NeuralNodeInferenceService(DEFAULT_NEURAL_NODE_MODEL_CONFIG, deterministicRandom);

  assert.throws(() => service.infer({ sequence: [], staticFeatures }), /at least one frame/);
  assert.throws(
    () => service.infer({ sequence: Array.from({ length: 4097 }, frame), staticFeatures }),
    /maximum supported length/,
  );
});

test('Neural Node service enforces model safety limits', () => {
  assert.throws(
    () => new NeuralNodeInferenceService({
      ...DEFAULT_NEURAL_NODE_MODEL_CONFIG,
      sequence: { ...DEFAULT_NEURAL_NODE_MODEL_CONFIG.sequence, hiddenSize: 2049 },
    }, deterministicRandom),
    /safety limit/,
  );
});
