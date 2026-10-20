import type { CL1Plugin } from './PluginTypes';
import { createNeuralNodeMlpGruPlugin } from './neural-node-mlp-gru';

const createPlugin = (manifest: CL1Plugin['manifest']): CL1Plugin => ({
  manifest,
  initialize: ({ logger, safety }) => {
    if (!safety.simulationOnly || safety.physicalHardwareAccess) {
      throw new Error('Unsafe plugin context: CL1 Neural Labs plugins are simulation-only.');
    }
    logger.info('Initialized', { capabilities: manifest.capabilities ?? [] });
  },
  start: ({ events, logger }) => {
    events.emit('plugin.started', manifest.id);
    logger.info('Started');
  },
  stop: ({ events, logger }) => {
    events.emit('plugin.stopped', manifest.id);
    logger.info('Stopped');
  },
  dispose: ({ logger }) => logger.info('Disposed'),
});

export const BUILTIN_PLUGINS: CL1Plugin[] = [
  createPlugin({
    id: 'cl1.core',
    name: 'CL1 Core',
    version: '1.0.0',
    description: 'Plugin lifecycle, events, settings, and safety services.',
    category: 'core',
    capabilities: ['plugin-lifecycle', 'event-bus', 'settings'],
  }),
  createPlugin({
    id: 'cl1.neural-culture',
    name: 'Neural Culture Simulator',
    version: '1.0.0',
    description: 'Virtual neural-culture simulation services.',
    category: 'simulation',
    dependencies: ['cl1.core'],
    permissions: ['simulation.read', 'simulation.stimulate'],
    capabilities: ['virtual-culture', 'spikes', 'stimulation'],
  }),
  createPlugin({
    id: 'cl1.visualization',
    name: 'MEA Visualization',
    version: '1.0.0',
    description: '2D, 3D, raster, telemetry, and electrode visualization.',
    category: 'visualization',
    dependencies: ['cl1.core', 'cl1.neural-culture'],
    permissions: ['simulation.read'],
    capabilities: ['mea-2d', 'mea-3d', 'telemetry'],
  }),
  createPlugin({
    id: 'cl1.experiments',
    name: 'Experiment Suite',
    version: '1.0.0',
    description: 'Pong, maze, neurocognitive, and batch experiment modules.',
    category: 'experiments',
    dependencies: ['cl1.core', 'cl1.neural-culture'],
    permissions: ['simulation.read', 'simulation.stimulate'],
    capabilities: ['pong', 'maze', 'neurocognitive', 'batch-runs'],
  }),
  createPlugin({
    id: 'cl1.analysis',
    name: 'Neural Analysis',
    version: '1.0.0',
    description: 'Spike, signal, telemetry, and experiment analysis.',
    category: 'analysis',
    dependencies: ['cl1.core', 'cl1.neural-culture'],
    permissions: ['simulation.read', 'data.read'],
    capabilities: ['spike-analysis', 'telemetry-analysis'],
  }),
  createPlugin({
    id: 'cl1.data',
    name: 'Data & Recording',
    version: '1.0.0',
    description: 'Local recording, export, dataset, and provenance services.',
    category: 'data',
    dependencies: ['cl1.core'],
    permissions: ['data.read', 'data.write'],
    capabilities: ['recording', 'csv', 'json', 'provenance'],
  }),
  createPlugin({
    id: 'cl1.database',
    name: 'Database Connector',
    version: '1.0.0',
    description: 'Optional local database integration boundary.',
    category: 'data',
    enabledByDefault: false,
    dependencies: ['cl1.core', 'cl1.data'],
    permissions: ['data.read', 'data.write', 'network.local'],
    capabilities: ['database-adapter'],
  }),
  createPlugin({
    id: 'cl1.ai',
    name: 'AI & ML Tools',
    version: '1.0.0',
    description: 'Analysis and model integration boundary for future AI tooling.',
    category: 'ai',
    enabledByDefault: false,
    dependencies: ['cl1.core', 'cl1.analysis', 'cl1.data'],
    permissions: ['data.read'],
    capabilities: ['feature-extraction', 'model-adapter'],
  }),
  createNeuralNodeMlpGruPlugin(),
  createPlugin({
    id: 'cl1.developer',
    name: 'Developer Diagnostics',
    version: '1.0.0',
    description: 'Debug overlays, diagnostics, and performance instrumentation.',
    category: 'developer',
    enabledByDefault: false,
    dependencies: ['cl1.core'],
    permissions: ['developer.diagnostics'],
    capabilities: ['debug-overlay', 'performance-counters'],
  }),
];
