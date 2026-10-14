#!/usr/bin/env python3
"""Compare simple synthetic spike model families for software pipeline testing.

Families: poisson-baseline, refractory-poisson, burst-modulated. These are toy
statistical baselines, not biophysical models or predictions about CL1 cultures.
"""
import argparse
import csv
import random
from pathlib import Path


def simulate(model, duration_s, channels, rate_hz, seed):
    rng = random.Random(seed)
    output = []
    for ch in range(channels):
        t = 0.0
        last = -1e9
        while t < duration_s and rate_hz > 0:
            local_rate = rate_hz
            if model == "burst-modulated" and int(t * 5) % 5 in (2, 3):
                local_rate *= 3.0
            t += rng.expovariate(local_rate)
            if t >= duration_s:
                break
            if model == "refractory-poisson" and t - last < 0.05:
                continue
            output.append((round(t * 1000, 3), ch))
            last = t
    return sorted(output)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--duration", type=float, default=10)
    p.add_argument("--channels", type=int, default=64)
    p.add_argument("--rate-hz", type=float, default=4)
    p.add_argument("--seed", type=int, default=2026)
    p.add_argument("--output-dir", type=Path, default=Path("model_comparison"))
    a = p.parse_args()
    if a.duration <= 0 or a.channels < 1 or a.rate_hz < 0:
        p.error("duration/channels must be positive and rate must be non-negative")
    a.output_dir.mkdir(parents=True, exist_ok=True)
    summary = []
    for index, model in enumerate(("poisson-baseline", "refractory-poisson", "burst-modulated")):
        events = simulate(model, a.duration, a.channels, a.rate_hz, a.seed + index)
        path = a.output_dir / (model + ".csv")
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["timestamp", "channel"])
            w.writerows(events)
        summary.append({"model_family": model, "events": len(events), "output": str(path), "seed": a.seed + index, "data_type": "synthetic"})
    with (a.output_dir / "summary.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["model_family", "events", "output", "seed", "data_type"])
        w.writeheader()
        w.writerows(summary)
    print("Generated synthetic model-family comparison; not biological evidence.")

if __name__ == "__main__":
    main()
