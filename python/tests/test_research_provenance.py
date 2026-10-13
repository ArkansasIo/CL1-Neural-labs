import unittest

from cl1_neural_lab.research_provenance import (
    DataSourceStage,
    ProvenanceRecord,
    require_physical_read_only,
)


class ResearchProvenanceTests(unittest.TestCase):
    def test_record_has_utc_timestamp_and_serializes_enum(self):
        record = ProvenanceRecord.create(
            DataSourceStage.SYNTHETIC_MODEL, "demo-001", "0.4.0", "unit test"
        )
        payload = record.to_dict()
        self.assertEqual(payload["stage"], "synthetic_model")
        self.assertTrue(payload["created_at_utc"].endswith("+00:00"))
        self.assertEqual(payload["dataset_id"], "demo-001")

    def test_required_identifiers_must_not_be_blank(self):
        with self.assertRaises(ValueError):
            ProvenanceRecord.create(DataSourceStage.DATASET_REPLAY, " ", "0.4.0")
        with self.assertRaises(ValueError):
            ProvenanceRecord.create(DataSourceStage.DATASET_REPLAY, "dataset", " ")

    def test_simulator_cannot_be_mislabeled_as_physical_data(self):
        record = ProvenanceRecord.create(
            DataSourceStage.SDK_SIMULATOR, "sim-001", "0.4.0"
        )
        with self.assertRaisesRegex(ValueError, "physical_cl1"):
            require_physical_read_only(record)

    def test_physical_label_passes_provenance_assertion(self):
        record = ProvenanceRecord.create(
            DataSourceStage.PHYSICAL_CL1, "device-recording-001", "0.4.0"
        )
        require_physical_read_only(record)


if __name__ == "__main__":
    unittest.main()
