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
        return AnalysisSnapshot(
            timestamp=frame.timestamp,
            functional_connectivity_matrix=matrix,
            active_channels=int(sum(active)),
            method="synthetic co-activity placeholder; not validated functional connectivity",
        )
