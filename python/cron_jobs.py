"""Small dependency-free scheduler for CL1 Neural Labs maintenance jobs.

The process is intentionally safe by default: jobs only call the local Rust API
and do not enable physical-device control.
"""
import argparse
import json
import os
import time
import urllib.request

RUST_URL = os.getenv("CL1_RUST_BACKEND_URL", "http://127.0.0.1:8100").rstrip("/")


def get(path: str) -> dict:
    with urllib.request.urlopen(RUST_URL + path, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def heartbeat() -> None:
    print(json.dumps({"job": "heartbeat", "status": get("/api/status")}))


def experiment_catalog() -> None:
    print(json.dumps({"job": "experiment-catalog", "experiments": get("/api/experiments")}, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--job", choices=["heartbeat", "experiment-catalog"], default="heartbeat")
    parser.add_argument("--interval", type=int, default=300)
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()

    jobs = {"heartbeat": heartbeat, "experiment-catalog": experiment_catalog}
    while True:
        try:
            jobs[args.job]()
        except Exception as exc:
            print(json.dumps({"job": args.job, "error": str(exc)}))
        if args.once:
            return
        time.sleep(max(args.interval, 60))


if __name__ == "__main__":
    main()
