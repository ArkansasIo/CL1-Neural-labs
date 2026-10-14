"""Tests for pure-Python mathematical helpers."""
import math
import unittest

from cl1_neural_lab.math_models import (
    bin_spikes,
    euler_step,
    firing_rate,
    logistic,
    population_activity,
    shannon_entropy,
)


class MathematicalModelTests(unittest.TestCase):
    def test_firing_rate_half_open_interval(self):
        self.assertEqual(firing_rate([0.0, 0.2, 0.9, 1.0], 0.0, 1.0), 3.0)

    def test_firing_rate_rejects_invalid_window(self):
        with self.assertRaises(ValueError):
            firing_rate([], 1.0, 1.0)

    def test_bin_spikes_includes_final_partial_bin(self):
        self.assertEqual(bin_spikes([0.1, 0.4, 0.8, 1.0], 0.0, 1.0, 0.3), [1, 1, 1, 0])

    def test_population_activity_fraction(self):
        self.assertEqual(population_activity([[0, 1], [2, 0]]), [0.5, 0.5])

    def test_logistic_is_stable_for_extreme_values(self):
        self.assertEqual(logistic(1000), 1.0)
        self.assertEqual(logistic(-1000), 0.0)
        self.assertTrue(math.isclose(logistic(0), 0.5))

    def test_euler_step_for_constant_derivative(self):
        self.assertEqual(euler_step(2.0, 0.0, 0.25, lambda _t, _y: 4.0), 3.0)

    def test_entropy_for_uniform_binary_distribution(self):
        self.assertTrue(math.isclose(shannon_entropy([0.5, 0.5]), 1.0))

    def test_entropy_rejects_unormalized_probabilities(self):
        with self.assertRaises(ValueError):
            shannon_entropy([0.2, 0.2])


if __name__ == "__main__":
    unittest.main()
