import unittest
from cl1_neural_lab.neural_culture import NeuralCultureSimulator
from cl1_neural_lab.analysis_engine import ElectrophysiologyAnalysisEngine
from cl1_neural_lab.database_store import CL1DatabaseStore
from cl1_neural_lab.plugins import PluginMetadata, PluginContext, ResearchPlugin, PluginRegistry

class CoreTests(unittest.TestCase):
    def test_simulator_frame_shape_and_timestamp(self):
        sim=NeuralCultureSimulator(seed=4)
        frame=sim.step(20)
        self.assertEqual(len(frame.min_values),64)
        self.assertEqual(len(frame.max_values),64)
        self.assertEqual(len(frame.flags),64)
        self.assertEqual(frame.timestamp,500)

    def test_stimulation_skips_ground_and_reference(self):
        sim=NeuralCultureSimulator(seed=4)
        result=sim.stimulate([0,4,10])
        self.assertEqual([s.channel for s in result],[10])

    def test_analysis_matrix_shape(self):
        sim=NeuralCultureSimulator(seed=4)
        for _ in range(4): sim.step(20)
        snap=ElectrophysiologyAnalysisEngine(sim).compute_snapshot()
        self.assertEqual(len(snap.functional_connectivity_matrix),64)
        self.assertTrue(all(len(row)==64 for row in snap.functional_connectivity_matrix))

    def test_database_tables(self):
        db=CL1DatabaseStore()
        self.assertIn("cultures",db.get_table_names())
        self.assertEqual(len(db.get_table_data("electrodes")),64)

    def test_plugin_registry(self):
        class DemoPlugin(ResearchPlugin):
            @property
            def metadata(self): return PluginMetadata("demo","0.1","test plugin",("analysis",))
            def activate(self,context): self.active=True
        registry=PluginRegistry(); plugin=DemoPlugin(); registry.register(plugin)
        registry.activate_all(PluginContext())
        self.assertTrue(plugin.active)
        self.assertEqual(registry.list_plugins()[0].name,"demo")

if __name__=="__main__": unittest.main()