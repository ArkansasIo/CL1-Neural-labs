#!/usr/bin/env python3
"""Summarise a CSV spike table (timestamp, channel) without third-party packages.

Timestamp units must be declared by the user. Output is descriptive and not a
validated biological inference. Example:
  python research/scripts/analyze_spike_train.py spikes.csv --timestamp-unit ms --channels 64
"""
import argparse
import csv
import json
import math
from collections import Counter, defaultdict
from pathlib import Path


def analyse(rows, channel_count, timestamp_unit, bin_ms, active_threshold):
    factor = {"ms": 1.0, "us": 0.001, "ticks25khz": 0.04}[timestamp_unit]
    valid = []
    rejected = 0
    for row in rows:
        try:
            t = float(row["timestamp"])
            ch = int(row["channel"])
            if not math.isfinite(t) or t < 0 or ch < 0 or ch >= channel_count:
                rejected += 1
                continue
            valid.append((t * factor, ch))
        except (KeyError, ValueError, TypeError):
            rejected += 1
    counts = Counter(ch for _, ch in valid)
    if not valid:
        duration_s = 0.0
    else:
        duration_s = max(0.001, (max(t for t, _ in valid) - min(t for t, _ in valid)) / 1000.0)
    rates = [{"channel": ch, "spikes": counts[ch], "rate_hz": round(counts[ch] / duration_s, 6)} for ch in range(channel_count)]
    bins = defaultdict(set)
    if valid:
        start = min(t for t, _ in valid)
        for t, ch in valid:
            bins[int((t - start) / bin_ms)].add(ch)
    population_bins = sum(len(chs) >= active_threshold for chs in bins.values())
    synchrony_proxy = sum(len(chs) / channel_count for chs in bins.values()) / len(bins) if bins else 0.0
    return {
        "provenance": "user-supplied CSV; analysis only",
        "timestamp_unit_input": timestamp_unit,
        "timestamp_unit_internal": "ms",
        "channel_count": channel_count,
        "valid_spikes": len(valid),
        "rejected_rows": rejected,
        "duration_seconds": round(duration_s, 6),
        "active_channels": len(counts),
        "mean_rate_per_channel_hz": round(len(valid) / duration_s / channel_count, 6) if duration_s else 0.0,
        "population_event_bins": population_bins,
        "synchrony_proxy": round(synchrony_proxy, 6),
        "bin_width_ms": bin_ms,
        "active_channel_threshold": active_threshold,
        "channel_rates": rates,
        "limitations": ["Descriptive metrics only; not a formal synchrony estimator.", "Input timestamps must use the declared unit.", "Synthetic and biological data must not be conflated."]
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_file", type=Path)
    parser.add_argument("--timestamp-unit", choices=["ms", "us", "ticks25khz"], default="ms")
    parser.add_argument("--channels", type=int, default=64)
    parser.add_argument("--bin-ms", type=float, default=100.0)
    parser.add_argument("--active-threshold", type=int, default=8)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.channels < 1 or args.bin_ms <= 0 or args.active_threshold < 1:
        parser.error("channels, bin-ms, and active-threshold must be positive")
    with args.csv_file.open(newline="", encoding="utf-8") as handle:
        result = analyse(csv.DictReader(handle), args.channels, args.timestamp_unit, args.bin_ms, args.active_threshold)
    text = json.dumps(result, indent=2)
    if args.output:
        args.output.write_text(text + "\n", encoding="utf-8")
    else:
        print(text)

if __name__ == "__main__":
    main()
