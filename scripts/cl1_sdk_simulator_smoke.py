"""Smoke test for the official CL SDK simulator; physical devices are refused.

Install with: python -m pip install cl-sdk
This script requires the official SDK to report simulator mode before opening
a connection. It records one second of synthetic/replayed data and does not
issue stimulation.
"""
import json
import cl


def main() -> None:
    # Fail closed: do not run this automated smoke test on physical hardware.
    if not cl.is_simulator():
        raise SystemExit(
            "Refusing to run: official CL SDK reports physical-device mode. "
            "Use only an explicitly configured CL SDK simulator environment."
        )

    with cl.open(take_control=False) as neurons:
        recording = neurons.record(
            stop_after_seconds=1,
            file_suffix="cl_sdk_smoke",
            attributes={
                "application": "CL1 Neural Labs",
                "test_kind": "sdk_simulator_smoke",
                "data_provenance": "sdk_simulator",
            },
        )
        recording.wait_until_stopped()
        print(json.dumps({
            "source": "cl_sdk_simulator",
            "recording_status": getattr(recording, "status", "unknown"),
            "recording_file": getattr(recording, "file", None),
            "physical_device_accessed": False,
        }, indent=2, default=str))


if __name__ == "__main__":
    main()
