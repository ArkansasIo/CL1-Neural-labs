"""Deterministic software-only 64-channel neural culture simulator.

The model is intended for software tests and education. It is not a biological
model validated against living cultures and never controls physical hardware.
"""
from __future__ import annotations
import random
from dataclasses import dataclass
from .types import (
    TOTAL_CHANNELS, GROUNDED_CHANNELS, REFERENCE_CHANNELS,
    FLAG_HAS_SPIKE, FLAG_HAS_STIM, NeuralFrame,
)

@dataclass(frozen=True)
class StimEvent:
    channel: int
    timestamp: int

class NeuralCultureSimulator:
    def __init__(self, seed: int | None = None):
        self._rng = random.Random(seed)
        self._timestamp = 0
        self._stim_queue: list[int] = []
        self._spike_probability = 0.045
        self._recent_spikes: list[dict[str, int]] = []

    def step(self, dt_ms: float = 20) -> NeuralFrame:
        if dt_ms <= 0:
            raise ValueError("dt_ms must be positive")
        # 25 kHz sample units: 20 ms advances by 500 samples.
        self._timestamp += round(dt_ms * 25)
        mins: list[int] = []
        maxs: list[int] = []
        flags: list[int] = []
        spikes: list[dict[str, int]] = []
        for channel in range(TOTAL_CHANNELS):
            flag = 0
            if channel in GROUNDED_CHANNELS:
                low = self._rng.randint(-2, 0)
                high = self._rng.randint(0, 2)
            elif channel in REFERENCE_CHANNELS:
                low = self._rng.randint(-4, 0)
                high = self._rng.randint(0, 4)
            elif channel in self._stim_queue:
                self._stim_queue.remove(channel)
                low, high, flag = -3000, 3000, FLAG_HAS_STIM
            elif self._rng.random() < self._spike_probability:
                low, high, flag = -410, 180, FLAG_HAS_SPIKE
            else:
                center = self._rng.randint(-12, 12)
                low, high = center - 25, center + 25
            if flag & FLAG_HAS_SPIKE:
                spikes.append({"timestamp": self._timestamp, "channel": channel})
            mins.append(low)
            maxs.append(high)
            flags.append(flag)
        self._recent_spikes.extend(spikes)
        if len(self._recent_spikes) > 10_000:
            del self._recent_spikes[:-10_000]
        return NeuralFrame(self._timestamp, tuple(mins), tuple(maxs), tuple(flags), tuple(spikes))

    def stimulate(self, channels: list[int] | tuple[int, ...]) -> list[StimEvent]:
        accepted: list[StimEvent] = []
        for channel in channels:
            if not isinstance(channel, int) or not 0 <= channel < TOTAL_CHANNELS:
                raise ValueError(f"Channel must be an integer from 0 to {TOTAL_CHANNELS - 1}")
            if channel in GROUNDED_CHANNELS or channel in REFERENCE_CHANNELS:
                continue
            if channel not in self._stim_queue:
                self._stim_queue.append(channel)
            accepted.append(StimEvent(channel, self._timestamp))
        return accepted

    @property
    def timestamp(self) -> int:
        return self._timestamp

    def get_timestamp(self) -> int:
        return self._timestamp

    def get_recent_spikes(self) -> list[dict[str, int]]:
        return list(self._recent_spikes)
