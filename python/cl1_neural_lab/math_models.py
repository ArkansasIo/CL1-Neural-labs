"""Pure-Python mathematical helpers for neural signal analysis.

These functions operate on synthetic or supplied event data. They do not infer
anatomical connectivity and do not control physical CL1 hardware.
"""
from __future__ import annotations

import math
from collections.abc import Callable, Iterable, Sequence


def firing_rate(spike_times_s: Iterable[float], start_s: float, end_s: float) -> float:
    """Return spikes/second for events in the half-open interval [start_s, end_s)."""
    if not (math.isfinite(start_s) and math.isfinite(end_s)) or end_s <= start_s:
        raise ValueError("end_s must be finite and greater than finite start_s")
    count = 0
    for value in spike_times_s:
        if not math.isfinite(value):
            raise ValueError("spike timestamps must be finite")
        if start_s <= value < end_s:
            count += 1
    return count / (end_s - start_s)


def bin_spikes(
    spike_times_s: Iterable[float], start_s: float, end_s: float, bin_width_s: float
) -> list[int]:
    """Count events in equal-width bins; final partial bin is included if needed."""
    if not (math.isfinite(start_s) and math.isfinite(end_s)) or end_s <= start_s:
        raise ValueError("end_s must be finite and greater than finite start_s")
    if not math.isfinite(bin_width_s) or bin_width_s <= 0:
        raise ValueError("bin_width_s must be finite and positive")
    n_bins = math.ceil((end_s - start_s) / bin_width_s)
    counts = [0] * n_bins
    for value in spike_times_s:
        if not math.isfinite(value):
            raise ValueError("spike timestamps must be finite")
        if start_s <= value < end_s:
            index = int((value - start_s) / bin_width_s)
            counts[min(index, n_bins - 1)] += 1
    return counts


def population_activity(binned_counts: Sequence[Sequence[int]]) -> list[float]:
    """Return fraction of represented channels with >=1 event in each time bin."""
    if not binned_counts:
        raise ValueError("at least one channel is required")
    n_bins = len(binned_counts[0])
    if any(len(row) != n_bins for row in binned_counts):
        raise ValueError("all channel rows must have equal length")
    if any(value < 0 for row in binned_counts for value in row):
        raise ValueError("spike counts cannot be negative")
    if n_bins == 0:
        return []
    n_channels = len(binned_counts)
    return [
        sum(1 for row in binned_counts if row[k] > 0) / n_channels
        for k in range(n_bins)
    ]


def logistic(value: float) -> float:
    """Numerically stable logistic sigmoid."""
    if not math.isfinite(value):
        if value == math.inf:
            return 1.0
        if value == -math.inf:
            return 0.0
        raise ValueError("value cannot be NaN")
    if value >= 0:
        z = math.exp(-value)
        return 1.0 / (1.0 + z)
    z = math.exp(value)
    return z / (1.0 + z)


def euler_step(
    state: float, time_s: float, step_s: float, derivative: Callable[[float, float], float]
) -> float:
    """One forward-Euler integration step for dy/dt = derivative(t, y)."""
    if not (math.isfinite(state) and math.isfinite(time_s)):
        raise ValueError("state and time_s must be finite")
    if not math.isfinite(step_s) or step_s <= 0:
        raise ValueError("step_s must be finite and positive")
    slope = derivative(time_s, state)
    if not math.isfinite(slope):
        raise ValueError("derivative must return a finite value")
    result = state + step_s * slope
    if not math.isfinite(result):
        raise ValueError("integration produced a non-finite result")
    return result


def shannon_entropy(probabilities: Iterable[float], log_base: float = 2.0) -> float:
    """Shannon entropy in bits by default; zero-probability terms contribute zero."""
    values = list(probabilities)
    if not values:
        raise ValueError("probabilities cannot be empty")
    if not math.isfinite(log_base) or log_base <= 0 or log_base == 1:
        raise ValueError("log_base must be positive and not equal to one")
    if any(not math.isfinite(p) or p < 0 for p in values):
        raise ValueError("probabilities must be finite and non-negative")
    total = sum(values)
    if not math.isclose(total, 1.0, rel_tol=1e-9, abs_tol=1e-9):
        raise ValueError("probabilities must sum to one")
    return -sum(p * math.log(p, log_base) for p in values if p > 0)
