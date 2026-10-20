export type PluginStatus = 'discovered' | 'disabled' | 'initializing' | 'running' | 'stopped' | 'error';

export type PluginCategory =
  | 'core'
  | 'simulation'
  | 'analysis'
  | 'visualization'
  | 'experiments'
  | 'data'
  | 'ai'
  | 'developer';

export interface CL1PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  category: PluginCategory;
  enabledByDefault?: boolean;
  dependencies?: string[];
  permissions?: string[];
  capabilities?: string[];
}

export interface PluginSafetyBoundary {
  simulationOnly: true;
  physicalHardwareAccess: false;
}

export interface PluginLogger {
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
}

export interface PluginEventBus {
  on(event: string, listener: (...args: unknown[]) => void): () => void;
  emit(event: string, ...args: unknown[]): void;
}

export interface PluginStorage {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export interface PluginSettings {
  get<T extends boolean | number | string>(key: string, fallback: T): T;
  set(key: string, value: boolean | number | string): void;
}

export interface PluginContext {
  readonly pluginId: string;
  readonly safety: PluginSafetyBoundary;
  readonly logger: PluginLogger;
  readonly events: PluginEventBus;
  readonly storage: PluginStorage;
  readonly settings: PluginSettings;
}

export interface CL1Plugin {
  manifest: CL1PluginManifest;
  initialize(context: PluginContext): void | Promise<void>;
  start(context: PluginContext): void | Promise<void>;
  stop(context: PluginContext): void | Promise<void>;
  dispose(context: PluginContext): void | Promise<void>;
}

export interface PluginRecord {
  plugin: CL1Plugin;
  status: PluginStatus;
  error?: string;
}
