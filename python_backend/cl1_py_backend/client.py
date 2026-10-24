"""CL1 Neural Labs — Python client frontend (terminal UI).

Connects to the Python backend (which fronts the Rust simulation core)
and renders a live 64-channel MEA view in the terminal.

Run:
    python -m cl1_py_backend.client            # default http://127.0.0.1:8200
    python -m cl1_py_backend.client --url http://host:8200
"""
from __future__ import annotations

import argparse
import json
import os
import urllib.request
from datetime import datetime

DEFAULT_URL = os.environ.get("CL1_PY_URL", "http://127.0.0.1:8200")

# ANSI helpers
CLEAR = "\033[2J\033[H"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"
GREEN = "\033[32m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
RED = "\033[31m"

# Ramp used to render channel activity: ' ' -> '.' -> '#' -> '@'
RAMP = " .:-=+*#%@"


def get_json(url: str, path: str, timeout: float = 3.0) -> dict:
    with urllib.request.urlopen(f"{url.rstrip('/')}{path}", timeout=timeout) as resp:
        return json.loads(resp.read().decode() or "{}")


def post_json(url: str, path: str, payload: dict, timeout: float = 3.0) -> dict:
    req = urllib.request.Request(
        f"{url.rstrip('/')}{path}",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode() or "{}")


def intensity_color(level: float) -> str:
    if level < 0.1:
        return DIM
    if level < 0.4:
        return CYAN
    if level < 0.7:
        return GREEN
    if level < 0.95:
        return YELLOW
    return RED


def render(report: dict) -> str:
    channels = report.get("channels", [])
    rates = [c.get("rate_hz", 0.0) for c in channels]
    max_rate = max(max(rates), 1e-6)

    out = [CLEAR + BOLD + "CL1 Neural Labs — Python client frontend" + RESET]
    out.append(
        f"tick={report.get('tick', 0)}  spikes={report.get('total_spikes', 0)}"
        f"  stims={report.get('total_stims', 0)}  mean_rate={report.get('mean_rate_hz', 0):.2f} Hz"
        + ("  [BURST]" if report.get("burst_active") else "")
    )
    out.append(DIM + "64-channel MEA activity (synthetic simulation)" + RESET)
    out.append("")

    # 8x8 MEA grid: one character per channel
    for row in range(8):
        line = []
        for col in range(8):
            idx = row * 8 + col
            level = rates[idx] / max_rate if idx < len(rates) else 0.0
            glyph = RAMP[min(int(level * (len(RAMP) - 1)) + (1 if level > 0.05 else 0), len(RAMP) - 1)]
            line.append(f"{intensity_color(level)}{glyph}{RESET} ")
        out.append("  " + "".join(line))

    out.append("")
    # Recent spikes ticker
    recent = report.get("spikes", [])[-8:]
    if recent:
        out.append(
            "recent spikes: "
            + ", ".join(f"ch{int(s['channel'])}@{s.get('amplitude_uv', 0):.0f}uV" for s in recent)
        )
    else:
        out.append(DIM + "recent spikes: (none this tick)" + RESET)
    out.append("")
    out.append(DIM + "Ctrl+C to quit." + RESET)
    return "\n".join(out)


def main() -> None:
    parser = argparse.ArgumentParser(description="CL1 Python client frontend")
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--interval", type=float, default=0.2, help="refresh seconds")
    args = parser.parse_args()

    print(f"Connecting to backend at {args.url} ...")
    try:
        health = get_json(args.url, "/api/health")
        print(f"backend health: {health}")
    except Exception as exc:  # noqa: BLE001
        raise SystemExit(f"Cannot reach backend: {exc}\nStart it with: python -m cl1_py_backend.server --demo")

    print("Press Ctrl+C to stop.\n")
    try:
        while True:
            try:
                report = get_json(args.url, "/api/status")
                print(render(report))
            except Exception as exc:  # noqa: BLE001
                print(f"{RED}stream error: {exc}{RESET}")
            import time

            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nClient stopped.")


if __name__ == "__main__":
    main()
