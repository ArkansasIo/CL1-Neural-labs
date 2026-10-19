export type LabSettingKind = 'toggle' | 'select' | 'number';

export interface LabSettingDefinition {
  id: string;
  label: string;
  description: string;
  kind: LabSettingKind;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue: boolean | number | string;
}

export interface LabModuleDefinition {
  id: string;
  label: string;
  description: string;
  enabledByDefault: boolean;
  settings: LabSettingDefinition[];
}

export const LAB_MODULES: LabModuleDefinition[] = [
  {
    id: 'simulation',
    label: 'Simulation Engine',
    description: 'Core virtual neural-culture runtime controls.',
    enabledByDefault: true,
    settings: [
      { id: 'deterministicSeed', label: 'Deterministic seed', description: 'Keep simulation runs reproducible.', kind: 'toggle', defaultValue: true },
      { id: 'autoReset', label: 'Auto reset after run', description: 'Reset the virtual culture when an experiment completes.', kind: 'toggle', defaultValue: false },
      { id: 'networkMode', label: 'Network model', description: 'Select the simulation connectivity model.', kind: 'select', options: ['Sparse', 'Balanced', 'Dense'], defaultValue: 'Balanced' },
      { id: 'noiseLevel', label: 'Background noise', description: 'Relative synthetic noise level.', kind: 'number', min: 0, max: 1, step: 0.05, defaultValue: 0.1 },
    ],
  },
  {
    id: 'visualization',
    label: 'Visualization',
    description: 'MEA, raster, 3D, and telemetry presentation options.',
    enabledByDefault: true,
    settings: [
      { id: 'showGrid', label: 'MEA grid overlay', description: 'Show electrode coordinate guides.', kind: 'toggle', defaultValue: true },
      { id: 'showTelemetry', label: 'Live telemetry', description: 'Show FPS, spikes, and stimulation counters.', kind: 'toggle', defaultValue: true },
      { id: 'showAnimations', label: 'Signal animations', description: 'Animate propagation and electrode activity.', kind: 'toggle', defaultValue: true },
      { id: 'renderQuality', label: 'Render quality', description: 'Choose the visual rendering workload.', kind: 'select', options: ['Low', 'Balanced', 'High', 'Ultra'], defaultValue: 'High' },
    ],
  },
  {
    id: 'experiments',
    label: 'Experiment Modules',
    description: 'Enable individual research and teaching modules.',
    enabledByDefault: true,
    settings: [
      { id: 'pong', label: 'Pong conditioning', description: 'Enable the Pong-style closed-loop experiment.', kind: 'toggle', defaultValue: true },
      { id: 'maze', label: 'Maze teaching', description: 'Enable maze conditioning tools.', kind: 'toggle', defaultValue: true },
      { id: 'neurocognitive', label: 'Neurocognitive tools', description: 'Enable cognitive task panels.', kind: 'toggle', defaultValue: true },
      { id: 'batchRuns', label: 'Batch experiments', description: 'Allow queued experiment runs.', kind: 'toggle', defaultValue: true },
    ],
  },
  {
    id: 'data',
    label: 'Data & Recording',
    description: 'Recording, export, dataset, and provenance switches.',
    enabledByDefault: true,
    settings: [
      { id: 'autoRecord', label: 'Auto recording', description: 'Start recording when a session begins.', kind: 'toggle', defaultValue: false },
      { id: 'csvExport', label: 'CSV export', description: 'Enable CSV dataset export controls.', kind: 'toggle', defaultValue: true },
      { id: 'jsonExport', label: 'JSON export', description: 'Enable JSON trace export controls.', kind: 'toggle', defaultValue: true },
      { id: 'provenance', label: 'Experiment provenance', description: 'Attach configuration metadata to saved runs.', kind: 'toggle', defaultValue: true },
    ],
  },
  {
    id: 'connectivity',
    label: 'Connectivity & Services',
    description: 'Optional local service and API integration switches.',
    enabledByDefault: true,
    settings: [
      { id: 'restApi', label: 'Local REST API', description: 'Expose simulator status endpoints.', kind: 'toggle', defaultValue: true },
      { id: 'websocket', label: 'WebSocket telemetry', description: 'Enable live overview telemetry streams.', kind: 'toggle', defaultValue: true },
      { id: 'database', label: 'Database connector', description: 'Enable configured local database integration.', kind: 'toggle', defaultValue: false },
      { id: 'serviceMode', label: 'Service mode', description: 'Select the runtime service profile.', kind: 'select', options: ['Offline', 'Local', 'Development'], defaultValue: 'Local' },
    ],
  },
  {
    id: 'safety',
    label: 'Safety & Boundaries',
    description: 'Simulation-only boundaries and protective defaults.',
    enabledByDefault: true,
    settings: [
      { id: 'simulationOnly', label: 'Simulation-only mode', description: 'Keep physical I/O disabled in this application.', kind: 'toggle', defaultValue: true },
      { id: 'blockPhysicalStim', label: 'Block physical stimulation', description: 'Prevent physical stimulation pathways.', kind: 'toggle', defaultValue: true },
      { id: 'confirmDestructive', label: 'Confirm destructive actions', description: 'Require confirmation before reset or data removal.', kind: 'toggle', defaultValue: true },
    ],
  },
  {
    id: 'developer',
    label: 'Developer & Diagnostics',
    description: 'Developer switches for testing and troubleshooting.',
    enabledByDefault: false,
    settings: [
      { id: 'debugOverlay', label: 'Debug overlay', description: 'Show runtime diagnostics.', kind: 'toggle', defaultValue: false },
      { id: 'verboseLogs', label: 'Verbose logs', description: 'Increase browser-side diagnostic logging.', kind: 'toggle', defaultValue: false },
      { id: 'perfCounters', label: 'Performance counters', description: 'Expose additional performance counters.', kind: 'toggle', defaultValue: true },
    ],
  },
];

export const DEFAULT_LAB_SETTINGS = Object.fromEntries(
  LAB_MODULES.flatMap((module) => module.settings.map((setting) => [setting.id, setting.defaultValue])),
) as Record<string, boolean | number | string>;

export const DEFAULT_MODULE_STATES = Object.fromEntries(
  LAB_MODULES.map((module) => [module.id, module.enabledByDefault]),
) as Record<string, boolean>;

export const LAB_SETTINGS_STORAGE_KEY = 'cl1-neural-labs.settings.v1';
