#!/usr/bin/env python3
"""Demonstrate a side-effect-free closed-loop proposal policy.

This script only prints recommendations. It never connects to CL1 or stimulates
hardware. Real-device control requires separate review and official API usage.
"""
import argparse
import json


def propose(rate_hz, target_hz, deadband_hz, now_ms, previous_ms, min_interval_ms, max_per_minute):
    error = target_hz - rate_hz
    if abs(error) <= deadband_hz:
        return {"propose": False, "reason": "within-deadband", "error_hz": round(error, 4)}
    if error < 0:
        return {"propose": False, "reason": "above-target", "error_hz": round(error, 4)}
    recent = [t for t in previous_ms if 0 <= now_ms - t < 60000]
    last = max((t for t in previous_ms if t <= now_ms), default=None)
    if len(recent) >= max_per_minute or (last is not None and now_ms - last < min_interval_ms):
        return {"propose": False, "reason": "rate-limited", "error_hz": round(error, 4)}
    return {"propose": True, "reason": "below-target", "error_hz": round(error, 4), "action": "SIMULATED PROPOSAL ONLY"}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--rate-hz", type=float, required=True)
    p.add_argument("--target-hz", type=float, default=4.0)
    p.add_argument("--deadband-hz", type=float, default=0.75)
    p.add_argument("--now-ms", type=float, default=60000)
    p.add_argument("--previous-action-ms", type=float, nargs="*", default=[])
    p.add_argument("--min-interval-ms", type=float, default=1000)
    p.add_argument("--max-per-minute", type=int, default=10)
    a = p.parse_args()
    if min(a.rate_hz, a.target_hz, a.deadband_hz, a.now_ms, a.min_interval_ms) < 0 or a.max_per_minute < 1:
        p.error("rates, times, and deadband must be non-negative; max-per-minute must be positive")
    print(json.dumps(propose(a.rate_hz, a.target_hz, a.deadband_hz, a.now_ms, a.previous_action_ms, a.min_interval_ms, a.max_per_minute), indent=2))

if __name__ == "__main__":
    main()
