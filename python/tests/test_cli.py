import contextlib
import io
import json
import unittest

from cl1_neural_lab.cli import main


class CLITests(unittest.TestCase):
    def test_json_output_is_reproducible_and_timestamp_matches_steps(self):
        first = io.StringIO()
        second = io.StringIO()
        with contextlib.redirect_stdout(first):
            main(["--steps", "2", "--seed", "9"])
        with contextlib.redirect_stdout(second):
            main(["--steps", "2", "--seed", "9"])
        result = json.loads(first.getvalue())
        self.assertEqual(result, json.loads(second.getvalue()))
        self.assertEqual(result["timestamp_samples"], 1000)
        self.assertEqual(result["steps"], 2)
        self.assertEqual(result["source"], "simulation")

    def test_negative_steps_rejected(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            main(["--steps", "-1"])

    def test_nonpositive_step_duration_rejected(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            main(["--step-ms", "0"])


if __name__ == "__main__":
    unittest.main()
