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

test('OpenAPI contract covers the implemented TypeScript REST routes', () => {
  const api = read('openapi.yaml');
  const server = read('server.ts');
  for (const route of ['/_/config', '/api/build', '/api/status', '/api/stim']) {
    assert.ok(api.includes(route), `OpenAPI route missing: ${route}`);
    assert.ok(server.includes(route), `server route missing: ${route}`);
  }
  assert.match(api, /Development-only API/);
  assert.match(server, /new WebSocketServer\(\{ server, path: '\/_\/ws\/overview' \}\)/);
});

test('simulator stimulation routes reject non-integer and blocked channels', () => {
  const server = read('server.ts');
  assert.match(server, /Number\.isInteger\(channel\)/);
  assert.match(server, /GROUNDED_CHANNELS\.includes\(channel\)/);
  assert.match(server, /REFERENCE_CHANNELS\.includes\(channel\)/);
  assert.match(server, /invalid, grounded, or reference channel IDs/);
});

test('package identity and version match the documented CL1 Neural Labs build', () => {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  const identity = read('docs/BUILD-IDENTITY.md');
  assert.equal(pkg.name, 'cl1-neural-labs');
  assert.equal(pkg.version, '0.4.0');
  assert.equal(lock.name, pkg.name);
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].name, pkg.name);
  assert.equal(lock.packages[''].version, pkg.version);
  assert.match(identity, /0\.4\.0/);
});

test('advanced settings registry and module switches are wired into the application', () => {
  for (const path of ['src/config/labSettings.ts', 'src/components/AdvancedSettingsModal.tsx']) {
    assert.ok(existsSync(resolve(root, path)), `missing advanced settings path: ${path}`);
  }
  const registry = read('src/config/labSettings.ts');
  const modal = read('src/components/AdvancedSettingsModal.tsx');
  const app = read('src/App.tsx');
  const header = read('src/components/Header.tsx');
  for (const module of ['simulation', 'visualization', 'experiments', 'data', 'connectivity', 'safety', 'developer']) {
    assert.match(registry, new RegExp(`id: '${module}'`), `module missing: ${module}`);
  }
  assert.match(modal, /localStorage/);
  assert.match(modal, /Module switch/);
  assert.match(modal, /Apply settings/);
  assert.match(app, /AdvancedSettingsModal/);
  assert.match(header, /onOpenAdvancedSettings/);
});