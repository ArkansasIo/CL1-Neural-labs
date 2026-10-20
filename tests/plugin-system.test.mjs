import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('plugin system exposes lifecycle contracts and simulation-only safety', () => {
  const types = read('src/plugins/PluginTypes.ts');
  const manager = read('src/plugins/PluginManager.ts');
  const context = read('src/plugins/PluginContext.ts');
  const builtins = read('src/plugins/builtin.ts');

  for (const symbol of ['CL1PluginManifest', 'PluginContext', 'PluginSafetyBoundary', 'PluginRecord']) {
    assert.match(types, new RegExp(`interface ${symbol}`));
  }
  for (const lifecycle of ['initializeAll', 'startAll', 'stopAll', 'disposeAll', 'enable', 'disable']) {
    assert.match(manager, new RegExp(`${lifecycle}\\(`));
  }
  assert.match(manager, /dependency cycle detected/i);
  assert.match(manager, /Missing plugin dependency/i);
  assert.match(context, /simulationOnly: true/);
  assert.match(context, /physicalHardwareAccess: false/);
  assert.match(builtins, /cl1\.neural-culture/);
  assert.match(builtins, /cl1\.visualization/);
  assert.match(builtins, /cl1\.experiments/);
  assert.match(builtins, /cl1\.analysis/);
  assert.match(builtins, /cl1\.data/);
  assert.match(builtins, /cl1\.database/);
  assert.match(builtins, /cl1\.ai/);
  assert.match(builtins, /cl1\.developer/);
});

test('plugin system is wired into the application startup', () => {
  const app = read('src/App.tsx');
  assert.match(app, /new PluginManager\(\)/);
  assert.match(app, /manager\.registerMany\(BUILTIN_PLUGINS\)/);
  assert.match(app, /pluginManager\.initializeAll\(\)/);
  assert.match(app, /pluginManager\.startAll\(\)/);
  assert.match(app, /pluginManager\.stopAll\(\)/);
  assert.match(app, /pluginManager\.disposeAll\(\)/);
});
