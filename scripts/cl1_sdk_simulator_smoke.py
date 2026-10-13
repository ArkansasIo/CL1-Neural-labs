"""Smoke test for the official CL SDK simulator; no physical device required.

Install with: python -m pip install cl-sdk
This verifies the SDK connection and recording API surface. It is not a
biological experiment; the simulator generates synthetic or replayed data.
"""
import json
import cl

def main():
    with cl.open() as neurons:
        recording = neurons.record(stop_after_seconds=1, file_suffix="cl_sdk_smoke")
        recording.wait_until_stopped()
        print(json.dumps({
            "source": "cl_sdk_simulator" if cl.is_simulator() else "physical_cl1",
            "recording_status": getattr(recording, "status", "unknown"),
            "recording_file": getattr(recording, "file", None),
        }, indent=2, default=str))

if __name__ == "__main__":
    main()
