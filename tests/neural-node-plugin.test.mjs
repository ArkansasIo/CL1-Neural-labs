import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Neural Node MLP-GRU plugin is registered as optional AI capability', () => {
  const builtin = read('src/plugins/builtin.ts');
  const app = read('src/App.tsx');
  const entry = read('src/plugins/neural-node-mlp-gru/index.ts');
  assert.match(builtin, /createNeuralNodeMlpGruPlugin/);
  assert.match(app, /BUILTIN_PLUGINS/);
  assert.match(entry, /enabledByDefault: false/);
  assert.match(entry, /physicalHardwareAccess/);
});

test('MLP-GRU source provides shape validation and all three architectures', () => {
  const tensor = read('src/plugins/neural-node-mlp-gru/tensor.ts');
  const dense = read('src/plugins/neural-node-mlp-gru/dense.ts');
  const mlp = read('src/plugins/neural-node-mlp-gru/mlp.ts');
  const gru = read('src/plugins/neural-node-mlp-gru/gru.ts');
  const hybrid = read('src/plugins/neural-node-mlp-gru/gru-mlp.ts');
  assert.match(tensor, /Number\.isFinite/);
  assert.match(dense, /class DenseLayer/);
  assert.match(mlp, /class MLP/);
  assert.match(gru, /class GRU/);
  assert.match(gru, /input dimension mismatch/);
  assert.match(hybrid, /class GRUMLPModel/);
  assert.match(hybrid, /static feature dimension mismatch/);
});
