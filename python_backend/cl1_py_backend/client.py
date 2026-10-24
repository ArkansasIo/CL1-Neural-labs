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
import time
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


def diagnostics_menu(base_url: str) -> None:
    """Interactive Neural Diagnostic System menu (synthetic only)."""
    MODALITIES = {
        "1": "eeg",
        "2": "mri",
        "3": "ct",
        "4": "fmri",
        "5": "mra",
        "6": "pet",
        "7": "spect",
        "8": "ecg",
        "9": "emg",
    }
    NAMES = {
        "eeg": "EEG — brain electrical activity",
        "mri": "MRI — brain structure",
        "ct": "CT — X-ray imaging (bleeding/trauma)",
        "fmri": "fMRI — functional activity/blood flow",
        "mra": "MRA/MRV — brain blood vessels",
        "pet": "PET — metabolic activity",
        "spect": "SPECT — regional blood flow",
        "ecg": "ECG/EKG — heart rhythm (brain-heart interaction)",
        "emg": "EMG/NCS — nerve and muscle electrical function",
    }
    while True:
        print(CLEAR + BOLD + "=== Neural Diagnostic System (synthetic) ===" + RESET)
        for key, mod in MODALITIES.items():
            print(f"  [{key}] {NAMES[mod]}")
        print("  [s] Run one full diagnostic cycle (all modalities)")
        print("  [p] Inject synthetic pathology (research simulation)")
        print("  [q] Back to live view")
        choice = input("Select> ").strip().lower()
        if choice == "q":
            return
        if choice == "s":
            result = post_json(base_url, "/api/diagnostics/step", {})
            print(json.dumps(result, indent=2))
            input("Enter to continue...")
        elif choice == "p":
            region = input("Region (frontal/parietal/temporal/occipital/cerebellum/brainstem): ").strip()
            kind = input("Kind (lesion/bleeding/hypoperfusion/hypometabolism): ").strip()
            try:
                magnitude = float(input("Magnitude (mm3 or % drop): ").strip() or "100")
            except ValueError:
                magnitude = 100.0
            result = post_json(base_url, "/api/diagnostics/pathology",
                               {"region": region, "kind": kind, "magnitude": magnitude})
            print(json.dumps(result, indent=2))
            input("Enter to continue...")
        elif choice in MODALITIES:
            mod = MODALITIES[choice]
            if mod in ("eeg", "ecg", "emg"):
                result = post_json(base_url, "/api/diagnostics/step", {})
                findings = [f for f in result.get("findings", []) if f["modality"] == mod]
            else:
                result = get_json(base_url, f"/api/diagnostics/scan/{mod}")
                findings = result.get("findings", [])
            print(BOLD + f"--- {NAMES[mod]} ---" + RESET)
            if findings:
                for f in findings:
                    sev = f.get("severity", "normal")
                    color = {"normal": GREEN, "mild": CYAN, "moderate": YELLOW, "severe": RED}.get(sev, RESET)
                    print(f" {color}[{sev}]{RESET} {f.get('finding') or f.get('anomaly')}"
                          f" {DIM}({f.get('region', f.get('note', ''))}){RESET}")
            else:
                print(GREEN + " no anomalies detected (simulated)" + RESET)
            print(DIM + result.get("disclaimer", "") + RESET)
            input("Enter to continue...")


def experiments_menu(base_url: str) -> None:
    """Interactive closed-loop experiment suite menu."""
    while True:
        print(CLEAR + BOLD + "=== Experiment Suite (synthetic closed-loop) ===" + RESET)
        try:
            data = get_json(base_url, "/api/experiments")
            experiments = data.get("experiments", [])
        except Exception as exc:  # noqa: BLE001
            print(f"{RED}failed to list experiments: {exc}{RESET}")
            return
        for i, exp in enumerate(experiments, 1):
            print(f"  [{i:2d}] {exp['name']:26s} — {exp['description'][:60]}")
        print("  [r] Run an experiment by number")
        print("  [q] Back")
        choice = input("Select> ").strip().lower()
        if choice == "q":
            return
        if choice == "r":
            idx = input(f"Experiment number (1-{len(experiments)}): ").strip()
            if not idx.isdigit() or not (1 <= int(idx) <= len(experiments)):
                print(RED + "invalid selection" + RESET)
                input("Enter to continue...")
                continue
            name = experiments[int(idx) - 1]["name"]
            ticks = input("Ticks to run [100]: ").strip() or "100"
            print(CYAN + f"running {name} for {ticks} ticks..." + RESET)
            result = post_json(base_url, "/api/experiments/run", {"name": name, "ticks": int(ticks)})
            print(json.dumps(result, indent=2))
            input("Enter to continue...")


def brainscript_repl(base_url: str) -> None:
    """Interactive BrainScript editor/run loop (Lua-like, OOP)."""
    print(BOLD + "BrainScript REPL — enter script; empty line to run, ':q' to quit" + RESET)
    print(DIM + "supports: local, if/then/else/end, while, for, function, class/method, tables" + RESET)
    while True:
        lines = []
        print(CYAN + "--- new script ---" + RESET)
        while True:
            try:
                line = input("> ")
            except EOFError:
                return
            if line.strip() == ":q":
                return
            if not line.strip():
                break
            lines.append(line)
        if not lines:
            continue
        src = "\n".join(lines)
        result = post_json(base_url, "/api/brainscript", {"script": src})
        if result.get("ok"):
            print(GREEN + f"result: {result.get('result')}" + RESET)
        else:
            print(RED + f"error: {result.get('error')}" + RESET)


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

    print("Keys: [d]iagnostics [e]xperiments [b]rainscript [q]uit. Ctrl+C to stop.\n")
    try:
        while True:
            try:
                report = get_json(args.url, "/api/status")
                print(render(report))
            except Exception as exc:  # noqa: BLE001
                print(f"{RED}stream error: {exc}{RESET}")
            try:
                import select
                import sys as _sys

                r, _, _ = select.select([_sys.stdin], [], [], args.interval)
                if r:
                    cmd = _sys.stdin.readline().strip().lower()
                    if cmd == "q":
                        print("Client stopped.")
                        break
                    if cmd == "d":
                        diagnostics_menu(args.url)
                    if cmd == "e":
                        experiments_menu(args.url)
                    if cmd == "b":
                        brainscript_repl(args.url)
            except ImportError:
                # Windows: select on stdin unsupported; fall back to sleep
                time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nClient stopped.")


if __name__ == "__main__":
    main()
