import type { CL1Plugin, CL1PluginManifest, PluginRecord } from './PluginTypes';

export class PluginRegistry {
  private readonly records = new Map<string, PluginRecord>();

  register(plugin: CL1Plugin): void {
    const { id } = plugin.manifest;
    if (!id || !/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(id)) {
      throw new Error(`Invalid plugin id: ${id}`);
    }
    if (this.records.has(id)) {
      throw new Error(`Plugin already registered: ${id}`);
    }
    this.records.set(id, {
      plugin,
      status: plugin.manifest.enabledByDefault === false ? 'disabled' : 'discovered',
    });
  }

  unregister(id: string): boolean {
    return this.records.delete(id);
  }

  get(id: string): PluginRecord | undefined {
    return this.records.get(id);
  }

  getManifest(id: string): CL1PluginManifest | undefined {
    return this.records.get(id)?.plugin.manifest;
  }

  list(): PluginRecord[] {
    return [...this.records.values()];
  }

  setStatus(id: string, status: PluginRecord['status'], error?: string): void {
    const record = this.records.get(id);
    if (!record) throw new Error(`Unknown plugin: ${id}`);
    record.status = status;
    record.error = error;
  }
}
