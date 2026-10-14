"""Basic analysis utilities for synthetic 64-channel frames."""
from __future__ import annotations
from dataclasses import dataclass
from .neural_culture import NeuralCultureSimulator
from .types import TOTAL_CHANNELS, FLAG_HAS_SPIKE

@dataclass(frozen=True)
class AnalysisSnapshot:
    timestamp: int
    functional_connectivity_matrix: list[list[float]]
    active_channels: int
    method: str
    average_firing_rate_hz: float
    active_electrode_count: int
    network_criticality_branching_ratio: float
    burst_frequency_hz: float

class ElectrophysiologyAnalysisEngine:
    def __init__(self, simulator: NeuralCultureSimulator):
        self.simulator = simulator

    def compute_snapshot(self) -> AnalysisSnapshot:
        # A symmetric, bounded synthetic connectivity estimate. This is a
        # placeholder metric for UI/testing, not a scientific inference claim.
        matrix = [[0.0 for _ in range(TOTAL_CHANNELS)] for _ in range(TOTAL_CHANNELS)]
        frame = self.simulator.step(20)
        active = [1.0 if flag & FLAG_HAS_SPIKE else 0.0 for flag in frame.flags]
        for i in range(TOTAL_CHANNELS):
            for j in range(i + 1, TOTAL_CHANNELS):
                value = (active[i] + active[j]) / 2.0
                matrix[i][j] = value
                matrix[j][i] = value
        active_count = int(sum(active))
        # A deliberately simple synthetic activity metric; not a biological estimate.
        firing_rate = active_count / max(1, TOTAL_CHANNELS - 5) / 0.02
        return AnalysisSnapshot(
            timestamp=frame.timestamp,
            functional_connectivity_matrix=matrix,
            active_channels=active_count,
            average_firing_rate_hz=firing_rate,
            active_electrode_count=active_count,
            network_criticality_branching_ratio=active_count / max(1, TOTAL_CHANNELS - 5),
            burst_frequency_hz=0.0,
            method="synthetic co-activity placeholder; not validated functional connectivity",
        )
