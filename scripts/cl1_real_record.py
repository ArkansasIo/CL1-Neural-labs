"""Record a short CL1 session using the official API.

Default safety behavior: physical device access is disabled unless
CL1_REAL_DEVICE=1. This script records only; it does not stimulate.
Run only in the vendor-supported CL1/SDK environment.
"""
import argparse
import json
import os
from sdk.python.cl1_real_adapter import RealCL1Adapter

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seconds", type=float, default=3.0)
    parser.add_argument("--output-dir", default=None)
    parser.add_argument("--suffix", default="cl1_neural_labs")
    args = parser.parse_args()
    if os.getenv("CL1_REAL_DEVICE") != "1":
        parser.error("Physical access is disabled. Set CL1_REAL_DEVICE=1 on the authorized CL1 host.")
    adapter = RealCL1Adapter()
    result = adapter.record_for(args.seconds, file_location=args.output_dir, file_suffix=args.suffix)
    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    main()
