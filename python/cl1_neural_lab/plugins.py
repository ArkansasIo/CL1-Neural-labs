"""Plugin interfaces for independently installable CL1 Neural Labs research modules."""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

@dataclass(frozen=True)
class PluginMetadata:
    name: str
    version: str
    description: str
    capabilities: tuple[str, ...] = ()

@dataclass
class PluginContext:
    """Services exposed to plugins. Hardware access is deliberately not implicit."""
    simulator: Any = None
    analysis: Any = None
    database: Any = None
    config: dict[str, Any] = field(default_factory=dict)
    event_sink: Any = None

class ResearchPlugin(ABC):
    """Base class for experiment, analysis, data-source, or visualization plugins."""
    @property
    @abstractmethod
    def metadata(self) -> PluginMetadata:
        raise NotImplementedError

    def configure(self, config: dict[str, Any]) -> None:
        """Validate and retain plugin-specific configuration."""
        self.config = dict(config)

    @abstractmethod
    def activate(self, context: PluginContext) -> None:
        """Attach the plugin to explicitly provided services."""
        raise NotImplementedError

    def deactivate(self) -> None:
        """Release resources. Override when the plugin owns resources."""

class PluginRegistry:
    """Small deterministic registry; discovery/loading is kept explicit and auditable."""
    def __init__(self):
        self._plugins: dict[str, ResearchPlugin] = {}

    def register(self, plugin: ResearchPlugin) -> None:
        name = plugin.metadata.name
        if not name or name in self._plugins:
            raise ValueError(f"Plugin name is empty or already registered: {name!r}")
        self._plugins[name] = plugin

    def get(self, name: str) -> ResearchPlugin:
        return self._plugins[name]

    def list_plugins(self) -> list[PluginMetadata]:
        return [p.metadata for p in self._plugins.values()]

    def activate_all(self, context: PluginContext) -> None:
        activated = []
        try:
            for plugin in self._plugins.values():
                plugin.activate(context)
                activated.append(plugin)
        except Exception:
            for plugin in reversed(activated):
                plugin.deactivate()
            raise

    def deactivate_all(self) -> None:
        for plugin in reversed(list(self._plugins.values())):
            plugin.deactivate()