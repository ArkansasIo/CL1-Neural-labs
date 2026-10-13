"""Run a short, recording-only session against the official CL SDK simulator.

The runner intentionally refuses to operate when the environment requests real
hardware. It does not stimulate. A source check is performed after cl.open().
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import time

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seconds", type=float, default=1.0)
    parser.add_argument("--output-dir", default="sandbox/output")
    args = parser.parse_args()
    if args.seconds <= 0 or args.seconds > 30:
        parser.error("--seconds must be in the range 0 < seconds <= 30")
    if os.getenv("CL1_REAL_DEVICE") == "1":
        parser.error("Refusing to run: CL1_REAL_DEVICE=1. Unset it before using the sandbox.")
    # The official SDK simulator uses these environment settings to configure
    # replay and timing. This script does not set a physical-device flag.
    os.environ.setdefault("CL_SDK_ACCELERATED_TIME", "0")
    try:
        import cl
    except ImportError:
        parser.error("Official CL SDK is missing. Install it with: python -m pip install cl-sdk")
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    start = time.time()
    with cl.open(take_control=False) as neurons:
        is_sim = bool(cl.is_simulator())
        if not is_sim:
            raise RuntimeError("SDK reported a physical device; sandbox runner has stopped.")
        recording = neurons.record(
            stop_after_seconds=args.seconds,
            file_location=str(output_dir),
            file_suffix="sandbox_smoke",
            attributes={"project": "CL1-Neural-labs", "provenance": "official_cl_sdk_simulator"},
        )
        recording.wait_until_stopped()
        result = {
            "status": "completed",
            "source": "official_cl_sdk_simulator",
            "is_simulator": is_sim,
            "requested_seconds": args.seconds,
            "elapsed_seconds": round(time.time() - start, 3),
            "recording": getattr(recording, "file", None),
            "recording_status": getattr(recording, "status", "unknown"),
            "stimulation_requested": False,
        }
    report = output_dir / "sandbox_report.json"
    report.write_text(json.dumps(result, indent=2, default=str), encoding="utf-8")
    print(json.dumps(result, indent=2, default=str))
    print("Report:", report)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
