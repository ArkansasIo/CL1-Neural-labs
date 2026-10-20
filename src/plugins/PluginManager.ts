import { createPluginContext } from './PluginContext';
import { PluginRegistry } from './PluginRegistry';
import type { CL1Plugin, PluginRecord } from './PluginTypes';

export class PluginManager {
  readonly registry = new PluginRegistry();
  private readonly contexts = new Map<string, ReturnType<typeof createPluginContext>>();

  register(plugin: CL1Plugin): void {
    this.registry.register(plugin);
  }

  registerMany(plugins: CL1Plugin[]): void {
    plugins.forEach((plugin) => this.register(plugin));
  }

  async initializeAll(): Promise<void> {
    for (const id of this.resolveOrder()) {
      const record = this.requireRecord(id);
      if (record.status === 'disabled') continue;
      const context = createPluginContext(id);
      this.contexts.set(id, context);
      this.registry.setStatus(id, 'initializing');
      try {
        await record.plugin.initialize(context);
      } catch (error) {
        this.registry.setStatus(id, 'error', error instanceof Error ? error.message : String(error));
        throw error;
      }
    }
  }

  async startAll(): Promise<void> {
    for (const id of this.resolveOrder()) {
      const record = this.requireRecord(id);
      if (record.status === 'disabled') continue;
      const context = this.contexts.get(id);
      if (!context) throw new Error(`Plugin has not been initialized: ${id}`);
      try {
        await record.plugin.start(context);
        this.registry.setStatus(id, 'running');
      } catch (error) {
        this.registry.setStatus(id, 'error', error instanceof Error ? error.message : String(error));
        throw error;
      }
    }
  }

  async stopAll(): Promise<void> {
    for (const id of [...this.resolveOrder()].reverse()) {
      const record = this.requireRecord(id);
      if (record.status !== 'running') continue;
      const context = this.contexts.get(id);
      if (!context) continue;
      await record.plugin.stop(context);
      this.registry.setStatus(id, 'stopped');
    }
  }

  async disposeAll(): Promise<void> {
    for (const id of [...this.resolveOrder()].reverse()) {
      const record = this.requireRecord(id);
      const context = this.contexts.get(id);
      if (!context) continue;
      await record.plugin.dispose(context);
      this.contexts.delete(id);
      this.registry.setStatus(id, 'stopped');
    }
  }

  async enable(id: string): Promise<void> {
    const record = this.requireRecord(id);
    if (record.status === 'running') return;
    if (record.status === 'error') {
      throw new Error(`Cannot enable plugin in error state without reload: ${id}`);
    }
    const dependencies = record.plugin.manifest.dependencies ?? [];
    for (const dependency of dependencies) {
      const dependencyRecord = this.requireRecord(dependency);
      if (dependencyRecord.status === 'disabled') {
        throw new Error(`Cannot enable ${id}; dependency is disabled: ${dependency}`);
      }
      if (dependencyRecord.status !== 'running' && dependencyRecord.status !== 'stopped') {
        throw new Error(`Cannot enable ${id}; dependency is not initialized: ${dependency}`);
      }
    }
    if (record.status !== 'disabled' && record.status !== 'stopped') return;
    this.registry.setStatus(id, 'discovered');
    await this.initializeOne(id);
    await this.startOne(id);
  }

  disable(id: string): void {
    const record = this.requireRecord(id);
    if (record.status === 'running') throw new Error(`Stop plugin before disabling it: ${id}`);
    this.registry.setStatus(id, 'disabled');
  }

  list(): PluginRecord[] {
    return this.registry.list();
  }

  private async initializeOne(id: string): Promise<void> {
    const record = this.requireRecord(id);
    const context = createPluginContext(id);
    this.contexts.set(id, context);
    this.registry.setStatus(id, 'initializing');
    await record.plugin.initialize(context);
  }

  private async startOne(id: string): Promise<void> {
    const record = this.requireRecord(id);
    const context = this.contexts.get(id);
    if (!context) throw new Error(`Plugin has not been initialized: ${id}`);
    await record.plugin.start(context);
    this.registry.setStatus(id, 'running');
  }

  private resolveOrder(): string[] {
    const order: string[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) throw new Error(`Plugin dependency cycle detected at: ${id}`);
      const record = this.requireRecord(id);
      visiting.add(id);
      for (const dependency of record.plugin.manifest.dependencies ?? []) {
        const dependencyRecord = this.registry.get(dependency);
        if (!dependencyRecord) throw new Error(`Missing plugin dependency: ${id} -> ${dependency}`);
        if (dependencyRecord.status !== 'disabled') visit(dependency);
      }
      visiting.delete(id);
      visited.add(id);
      order.push(id);
    };

    this.registry.list().forEach((record) => {
      if (record.status !== 'disabled') visit(record.plugin.manifest.id);
    });
    return order;
  }

  private requireRecord(id: string): PluginRecord {
    const record = this.registry.get(id);
    if (!record) throw new Error(`Unknown plugin: ${id}`);
    return record;
  }
}
