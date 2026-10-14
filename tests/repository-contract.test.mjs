import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('required application entry points and boot overlay exist', () => {
  for (const path of [
    'src/main.tsx',
    'src/App.tsx',
    'src/components/LinuxBootLoader.tsx',
    'src/components/Header.tsx',
    'src/simulation/neuralCulture.ts',
    'src/types/cl1.ts',
    'public/branding/cl1-neural-labs-logo.svg',
  ]) assert.ok(existsSync(resolve(root, path)), `missing required path: ${path}`);
  const app = read('src/App.tsx');
  assert.match(app, /import\s+\{\s*LinuxBootLoader\s*\}/);
  assert.match(app, /booting\s*&&\s*<LinuxBootLoader/);
});

test('boot overlay communicates simulation-only and locked physical I/O state', () => {
  const boot = read('src/components/LinuxBootLoader.tsx');
  assert.match(boot, /PROJECT-SIMULATOR/);
  assert.match(boot, /Physical I\/O/);
  assert.match(boot, /LOCKED/);
  assert.match(boot, /not a biological|application boot UI|Physical CL1 access/i);
});

test('release-gate scripts exist and npm lockfile matches package identity', () => {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(lock.name, pkg.name);
  assert.ok(pkg.scripts.lint, 'TypeScript type-check script missing');
  assert.ok(pkg.scripts.build, 'production build script missing');
  assert.ok(pkg.scripts.test, 'repository contract test script missing');
});

test('Python CLI dependencies and simulator modules are present', () => {
  for (const path of [
    'python/cl1_neural_lab/cli.py',
    'python/cl1_neural_lab/neural_culture.py',
    'python/cl1_neural_lab/analysis_engine.py',
    'python/cl1_neural_lab/database_store.py',
    'python/cl1_neural_lab/types.py',
    'python/tests/test_core.py',
    'python/tests/test_simulator.py',
  ]) assert.ok(existsSync(resolve(root, path)), `missing required path: ${path}`);
});
