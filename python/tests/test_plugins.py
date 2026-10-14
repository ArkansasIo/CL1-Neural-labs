import unittest

from cl1_neural_lab.plugins import PluginContext, PluginMetadata, PluginRegistry, ResearchPlugin


class DemoPlugin(ResearchPlugin):
    def __init__(self, name, fail=False):
        self._metadata = PluginMetadata(name, "1.0.0", "test plugin", ("test",))
        self.fail = fail
        self.active = False
        self.deactivated = False

    @property
    def metadata(self):
        return self._metadata

    def activate(self, context):
        self.active = True
        if self.fail:
            raise RuntimeError("activation failed")

    def deactivate(self):
        self.active = False
        self.deactivated = True


class PluginRegistryTests(unittest.TestCase):
    def test_register_list_and_activate(self):
        registry = PluginRegistry()
        plugin = DemoPlugin("analysis")
        registry.register(plugin)
        registry.activate_all(PluginContext(config={"mode": "test"}))
        self.assertTrue(plugin.active)
        self.assertEqual(registry.list_plugins()[0].name, "analysis")
        registry.deactivate_all()
        self.assertTrue(plugin.deactivated)
        self.assertFalse(plugin.active)

    def test_duplicate_names_rejected(self):
        registry = PluginRegistry()
        registry.register(DemoPlugin("same"))
        with self.assertRaises(ValueError):
            registry.register(DemoPlugin("same"))

    def test_activation_failure_rolls_back_prior_plugins(self):
        registry = PluginRegistry()
        first = DemoPlugin("first")
        second = DemoPlugin("second", fail=True)
        registry.register(first)
        registry.register(second)
        with self.assertRaisesRegex(RuntimeError, "activation failed"):
            registry.activate_all(PluginContext())
        self.assertTrue(first.deactivated)
        self.assertFalse(first.active)


if __name__ == "__main__":
    unittest.main()
