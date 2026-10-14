"""Shared data constants and value objects for the CL1 Neural Labs simulator.

These values define the project's software model; they are not vendor-verified
physical-device specifications.
"""
from __future__ import annotations
from dataclasses import dataclass

TOTAL_CHANNELS = 64
SAMPLING_RATE_HZ = 25_000
UV_PER_RAW_ADC = 0.195
GROUNDED_CHANNELS = (0, 7, 56, 63)
REFERENCE_CHANNELS = (4,)
FLAG_HAS_SPIKE = 1 << 0
FLAG_HAS_STIM = 1 << 1

@dataclass(frozen=True)
class NeuralFrame:
    """One synthetic/replayed 64-channel summary frame."""
    timestamp: int
    min_values: tuple[int, ...]
    max_values: tuple[int, ...]
    flags: tuple[int, ...]
