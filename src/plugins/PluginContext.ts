import type {
  PluginContext,
  PluginEventBus,
  PluginLogger,
  PluginSettings,
  PluginStorage,
} from './PluginTypes';

class EventBus implements PluginEventBus {
  private readonly listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  on(event: string, listener: (...args: unknown[]) => void): () => void {
    const bucket = this.listeners.get(event) ?? new Set<(...args: unknown[]) => void>();
    bucket.add(listener);
    this.listeners.set(event, bucket);
    return () => bucket.delete(listener);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }
}

class BrowserStorage implements PluginStorage {
  constructor(private readonly namespace: string) {}

  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`${this.namespace}.${key}`);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(`${this.namespace}.${key}`, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(`${this.namespace}.${key}`);
  }
}

class SettingsAdapter implements PluginSettings {
  constructor(private readonly namespace: string) {}

  get<T extends boolean | number | string>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`${this.namespace}.${key}`);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  set(key: string, value: boolean | number | string): void {
    localStorage.setItem(`${this.namespace}.${key}`, JSON.stringify(value));
  }
}

const loggerFor = (pluginId: string): PluginLogger => ({
  info: (message, metadata) => console.info(`[CL1:${pluginId}] ${message}`, metadata ?? ''),
  warn: (message, metadata) => console.warn(`[CL1:${pluginId}] ${message}`, metadata ?? ''),
  error: (message, metadata) => console.error(`[CL1:${pluginId}] ${message}`, metadata ?? ''),
});

export const createPluginContext = (pluginId: string): PluginContext => ({
  pluginId,
  safety: {
    simulationOnly: true,
    physicalHardwareAccess: false,
  },
  logger: loggerFor(pluginId),
  events: new EventBus(),
  storage: new BrowserStorage(`cl1.plugin.${pluginId}`),
  settings: new SettingsAdapter(`cl1.plugin.${pluginId}.settings`),
});
