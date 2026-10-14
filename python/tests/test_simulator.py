"""Regression tests for the software-only simulator and virtual hardware boundary."""
import unittest

from cl1_neural_lab.analysis_engine import ElectrophysiologyAnalysisEngine
from cl1_neural_lab.cluster import VirtualCL1Cluster
from cl1_neural_lab.database_store import CL1DatabaseStore
from cl1_neural_lab.neural_culture import NeuralCultureSimulator
from cl1_neural_lab.types import FLAG_HAS_SPIKE, TOTAL_CHANNELS
from cl1_neural_lab.virtual_hardware import DeviceMode, VirtualCL1Hardware


class SimulatorRegressionTests(unittest.TestCase):
    def test_seeded_frame_is_repeatable_and_has_64_channels(self):
        first = NeuralCultureSimulator(seed=42).step(20)
        second = NeuralCultureSimulator(seed=42).step(20)
        self.assertEqual(first, second)
        self.assertEqual(len(first.min_values), TOTAL_CHANNELS)
        self.assertEqual(len(first.max_values), TOTAL_CHANNELS)
        self.assertEqual(len(first.flags), TOTAL_CHANNELS)
        self.assertEqual(first.timestamp, 500)

    def test_stimulation_excludes_ground_and_reference(self):
        sim = NeuralCultureSimulator(seed=3)
        accepted = sim.stimulate([0, 4, 10])
        self.assertEqual([event.channel for event in accepted], [10])
        frame = sim.step()
        self.assertTrue(frame.flags[10] & 2)

    def test_analysis_shape_and_explicit_placeholder_label(self):
        sim = NeuralCultureSimulator(seed=7)
        snapshot = ElectrophysiologyAnalysisEngine(sim).compute_snapshot()
        self.assertEqual(len(snapshot.functional_connectivity_matrix), 64)
        self.assertTrue(all(len(row) == 64 for row in snapshot.functional_connectivity_matrix))
        self.assertIn("not validated", snapshot.method)
        self.assertGreaterEqual(snapshot.average_firing_rate_hz, 0)

    def test_database_seeds_64_electrodes(self):
        db = CL1DatabaseStore()
        self.assertIn("cultures", db.get_table_names())
        self.assertEqual(len(db.get_table_data("electrodes")), 64)
        db.close()

    def test_physical_modes_are_not_implemented(self):
        hardware = VirtualCL1Hardware()
        for mode in (DeviceMode.PHYSICAL_READ_ONLY, DeviceMode.PHYSICAL_CONTROL):
            with self.assertRaises(NotImplementedError):
                hardware.set_mode(mode)
        self.assertFalse(hardware.state.stimulation_enabled)

    def test_cluster_size_validation(self):
        cluster = VirtualCL1Cluster(2)
        self.assertEqual(len(cluster.status()), 2)
        with self.assertRaises(ValueError):
            VirtualCL1Cluster(3)


if __name__ == "__main__":
    unittest.main()
