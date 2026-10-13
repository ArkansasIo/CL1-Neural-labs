"""Virtual CL1-style hardware topology and telemetry.

This models the documented software-facing concepts for development and design review.
It is not an electrical schematic, firmware emulator, or physical-device driver.
"""
from __future__ import annotations
from dataclasses import dataclass, asdict
from enum import Enum
from time import time
from typing import Any
from .types import TOTAL_CHANNELS, SAMPLING_RATE_HZ, UV_PER_RAW_ADC, GROUNDED_CHANNELS, REFERENCE_CHANNELS

class DeviceMode(str, Enum):
    SIMULATOR = "simulator"
    DATA_REPLAY = "data_replay"
    PHYSICAL_READ_ONLY = "physical_read_only"
    PHYSICAL_CONTROL = "physical_control"

@dataclass(frozen=True)
class VirtualHardwareProfile:
    profile_id: str = "CL1-VIRTUAL-64"
    label: str = "CL1-style virtual MEA profile"
    channel_count: int = TOTAL_CHANNELS
    nominal_sample_rate_hz: int = SAMPLING_RATE_HZ
    microvolts_per_sample_unit: float = UV_PER_RAW_ADC
    grounded_channels: tuple[int, ...] = GROUNDED_CHANNELS
    reference_channels: tuple[int, ...] = REFERENCE_CHANNELS
    grid_rows: int = 8
    grid_columns: int = 8
    source_kind: str = "project_model_not_vendor_verified_hardware_layout"

@dataclass
class VirtualDeviceState:
    device_id: str = "CL1-VIRTUAL-001"
    mode: DeviceMode = DeviceMode.SIMULATOR
    connected: bool = False
    recording: bool = False
    stimulation_enabled: bool = False
    emergency_stop_latched: bool = False
    temperature_c: float | None = None
    last_error: str | None = None
    started_at_unix: float | None = None

class VirtualCL1Hardware:
    """A safe-by-default software model of the app's hardware boundary."""
    def __init__(self, profile: VirtualHardwareProfile | None = None):
        self.profile = profile or VirtualHardwareProfile()
        self.state = VirtualDeviceState()
        self.events: list[dict[str, Any]] = []

    def connect(self) -> dict[str, Any]:
        self.state.connected = True
        self.state.started_at_unix = time()
        self._event("connect", {"mode": self.state.mode.value})
        return self.describe()

    def disconnect(self) -> None:
        self.state.recording = False
        self.state.stimulation_enabled = False
        self.state.connected = False
        self._event("disconnect", {})

    def describe(self) -> dict[str, Any]:
        return {"profile": asdict(self.profile), "state": {
            **asdict(self.state), "mode": self.state.mode.value
        }, "hardware_control_supported": False}

    def set_mode(self, mode: DeviceMode) -> None:
        if mode in (DeviceMode.PHYSICAL_READ_ONLY, DeviceMode.PHYSICAL_CONTROL):
            raise NotImplementedError(
                "Physical modes require a separately implemented adapter using the official CL API."
            )
        self.state.mode = mode
        self._event("mode_changed", {"mode": mode.value})

    def start_recording(self, label: str = "untitled") -> dict[str, Any]:
        if not self.state.connected:
            raise RuntimeError("Connect the virtual device before recording.")
        self.state.recording = True
        event = self._event("recording_started", {"label": label, "source": self.state.mode.value})
        return event

    def stop_recording(self) -> dict[str, Any]:
        self.state.recording = False
        return self._event("recording_stopped", {})

    def request_stimulation(self, channels: list[int], *, operator_confirmed: bool = False) -> dict[str, Any]:
        """Record a virtual request only; never sends commands to a physical device."""
        if not self.state.connected:
            raise RuntimeError("Connect the virtual device before stimulation simulation.")
        if not operator_confirmed:
            raise PermissionError("Virtual stimulation requires explicit operator confirmation.")
        invalid = [ch for ch in channels if not isinstance(ch, int) or ch < 0 or ch >= self.profile.channel_count]
        blocked = [ch for ch in channels if ch in self.profile.grounded_channels or ch in self.profile.reference_channels]
        if invalid or blocked:
            raise ValueError(f"Invalid channels: {invalid}; non-stimulatable channels: {blocked}")
        if self.state.emergency_stop_latched:
            raise RuntimeError("Emergency stop is latched; reset is required.")
        return self._event("virtual_stimulation_requested", {
            "channels": channels, "dispatched_to_physical_hardware": False
        })

    def emergency_stop(self) -> None:
        self.state.emergency_stop_latched = True
        self.state.stimulation_enabled = False
        self._event("emergency_stop", {"latched": True})

    def reset_emergency_stop(self) -> None:
        self.state.emergency_stop_latched = False
        self._event("emergency_stop_reset", {"latched": False})

    def _event(self, event_type: str, details: dict[str, Any]) -> dict[str, Any]:
        item = {"event_type": event_type, "timestamp_unix": time(), "device_id": self.state.device_id,
                "source": "virtual", "details": details}
        self.events.append(item)
        return item
