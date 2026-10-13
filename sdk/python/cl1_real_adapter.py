"""Optional adapter for the official Cortical Labs CL API.

This adapter targets the official `cl-sdk` API documented at
https://docs.corticallabs.com/. It is intentionally not imported by the normal
simulator package. Install and test it in the CL1/SDK environment.

Safety defaults:
- Device access is opt-in through CL1_REAL_DEVICE=1.
- This adapter defaults to read/record-only workflows.
- Stimulation requires BOTH CL1_ALLOW_STIM=1 and an explicit
  operator_confirmed=True argument.
- No channel mapping is guessed here; channel sets must come from the
  active device profile and the experiment's approved protocol.
- This software gate is not a substitute for institutional procedures,
  vendor operating limits, or independent hardware safety measures.
"""
from __future__ import annotations
import os
from contextlib import contextmanager
from typing import Iterator, Any

class RealCL1Disabled(RuntimeError):
    """Raised when physical access has not been explicitly enabled."""

class RealCL1Adapter:
    """Thin, optional wrapper around the official CL API."""

    def __init__(self, *, allow_stimulation: bool = False):
        if os.getenv("CL1_REAL_DEVICE") != "1":
            raise RealCL1Disabled(
                "Physical access disabled. Set CL1_REAL_DEVICE=1 in the authorized device environment."
            )
        self.allow_stimulation = allow_stimulation and os.getenv("CL1_ALLOW_STIM") == "1"
        try:
            import cl  # supplied by official CL SDK/device environment
        except ImportError as exc:
            raise RuntimeError(
                "Official CL API is unavailable. Install/use the vendor-supported CL SDK environment."
            ) from exc
        self._cl = cl

    @contextmanager
    def open(self) -> Iterator[Any]:
        """Open a vendor-supported connection using the preferred context manager."""
        with self._cl.open() as neurons:
            yield neurons

    def record_for(self, seconds: float, *, file_location: str | None = None,
                   file_suffix: str = "cl1_neural_labs") -> dict[str, Any]:
        """Record through the official API; does not issue stimulation commands."""
        if seconds <= 0:
            raise ValueError("seconds must be positive")
        kwargs: dict[str, Any] = {"stop_after_seconds": seconds, "file_suffix": file_suffix}
        if file_location is not None:
            kwargs["file_location"] = file_location
        with self.open() as neurons:
            recording = neurons.record(**kwargs)
            recording.wait_until_stopped()
            # Return only the documented recording metadata needed by callers.
            return {
                "source": "physical_cl1" if not self._cl.is_simulator() else "cl_sdk_simulator",
                "file": getattr(recording, "file", None),
                "status": getattr(recording, "status", "unknown"),
            }

    def read_frames(self, frame_count: int) -> Any:
        """Read a bounded batch of raw frames; caller must label provenance."""
        if not 1 <= frame_count <= 250_000:
            raise ValueError("frame_count must be in the range 1..250000")
        with self.open() as neurons:
            return neurons.read(frame_count)

    def stimulate(self, channels: Any, design: Any, *,
                  operator_confirmed: bool = False, approved_protocol_id: str = "") -> None:
        """Request stimulation only when separately enabled and confirmed.

        Construct ChannelSet/StimDesign with the official SDK in the caller.
        This method intentionally does not choose channels or pulse parameters.
        """
        if not self.allow_stimulation:
            raise PermissionError("Stimulation is disabled; set CL1_ALLOW_STIM=1 in an approved environment.")
        if not operator_confirmed:
            raise PermissionError("Explicit operator confirmation is required.")
        if not approved_protocol_id.strip():
            raise PermissionError("An approved protocol ID is required for auditability.")
        with self.open() as neurons:
            neurons.stim(channels, design)
