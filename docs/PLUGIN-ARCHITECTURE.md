# Plugin Architecture

## Goal

CL1 Neural Labs supports independently developed research capabilities without coupling each capability to the React interface or to physical-device APIs.

## Plugin types

- **Experiment plugins:** implement a trial or closed-loop task.
- **Analysis plugins:** compute metrics from frames, spikes, and stimulation events.
- **Data-source plugins:** simulator, dataset replay, or an explicitly authorized CL1 adapter.
- **Storage plugins:** CSV, HDF5, MySQL, or other repositories.
- **Visualization plugins:** supply view models or exported summaries to the UI.

## Python interface

The initial host contract is in `python/cl1_neural_lab/plugins.py`:

- `PluginMetadata`: name, version, description, capabilities.
- `PluginContext`: explicitly injected services.
- `ResearchPlugin.configure()`
- `ResearchPlugin.activate()`
- `ResearchPlugin.deactivate()`
- `PluginRegistry`: registration and lifecycle management.

Plugins are registered explicitly in this first version. Do not execute arbitrary installed plugins automatically; later discovery should use declared entry points, allowlists, version checks, and clear operator consent.

## Example lifecycle

```python
registry = PluginRegistry()
registry.register(MyAnalysisPlugin())
registry.activate_all(PluginContext(simulator=simulator))
try:
    # Run experiment and analysis
    ...
finally:
    registry.deactivate_all()
```

## Hardware safety boundary

No plugin receives physical-device access by default. A future hardware adapter must be a separately configured integration, use official supported interfaces, validate device identity and command bounds, log operations, and keep emergency-stop/safety interlocks independent of plugin code.

## Planned roadmap

1. Stabilize event and frame schemas.
2. Add dataset-replay source plugin.
3. Add CSV/HDF5 storage plugins.
4. Add signal-processing analysis plugins.
5. Add read-only physical CL1 acquisition plugin using official API documentation.
6. Consider external plugin packaging and compatibility metadata.