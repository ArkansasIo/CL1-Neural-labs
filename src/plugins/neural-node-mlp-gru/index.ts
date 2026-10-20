export * from './tensor';
export * from './dense';
export * from './mlp';
export * from './gru';
export * from './gru-mlp';
export * from './config';
export * from './service';

import type { CL1Plugin } from '../PluginTypes';

export const NEURAL_NODE_MLP_GRU_VERSION = '4.0.0-alpha.1';

export function createNeuralNodeMlpGruPlugin(): CL1Plugin {
  return {
    manifest: {
      id: 'cl1.neural-node-mlp-gru',
      name: 'Neural Node MLP-GRU 4.0',
      version: NEURAL_NODE_MLP_GRU_VERSION,
      description: 'CPU-first MLP, GRU sequence encoder, and hybrid GRU-MLP inference primitives for simulated neural data.',
      category: 'ai',
      enabledByDefault: false,
      dependencies: ['cl1.core', 'cl1.analysis', 'cl1.data'],
      permissions: ['data.read'],
      capabilities: ['mlp-inference', 'gru-sequence-encoding', 'gru-mlp-hybrid', 'cpu-inference'],
    },
    initialize: ({ logger, safety }) => {
      if (!safety.simulationOnly || safety.physicalHardwareAccess) {
        throw new Error('Neural Node MLP-GRU requires the simulation-only safety boundary.');
      }
      logger.info('Neural Node MLP-GRU initialized', { version: NEURAL_NODE_MLP_GRU_VERSION });
    },
    start: ({ events, logger }) => {
      events.emit('plugin.started', 'cl1.neural-node-mlp-gru');
      logger.info('Neural Node MLP-GRU started');
    },
    stop: ({ events, logger }) => {
      events.emit('plugin.stopped', 'cl1.neural-node-mlp-gru');
      logger.info('Neural Node MLP-GRU stopped');
    },
    dispose: ({ logger }) => logger.info('Neural Node MLP-GRU disposed'),
  };
}
