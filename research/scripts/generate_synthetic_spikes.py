#!/usr/bin/env python3
"""Generate explicitly synthetic spike events for pipeline tests."""
import argparse
import csv
import random
from pathlib import Path


def generate(duration_s, channels, rate_hz, seed, burst_rate_hz):
    rng = random.Random(seed)
    events = []
    for channel in range(channels):
        t = 0.0
        while t < duration_s:
            # Exponential inter-arrival times create a Poisson baseline.
            rate = rate_hz
            if burst_rate_hz > 0 and rng.random() < min(1.0, burst_rate_hz / max(rate_hz, 1e-9)):
                rate *= 3.0
            if rate <= 0:
                break
            t += rng.expovariate(rate)
            if t < duration_s:
                events.append((round(t * 1000, 3), channel))
    events.sort()
    return events


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--duration", type=float, default=10.0, help="duration in seconds")
    p.add_argument("--channels", type=int, default=64)
    p.add_argument("--rate-hz", type=float, default=4.0)
    p.add_argument("--burst-rate-hz", type=float, default=0.0, help="simple modulation probability scale; not a mechanistic burst model")
    p.add_argument("--seed", type=int, default=2026)
    p.add_argument("--output", type=Path, default=Path("synthetic_spikes.csv"))
    a = p.parse_args()
    if a.duration <= 0 or a.channels < 1 or a.rate_hz < 0 or a.burst_rate_hz < 0:
        p.error("duration/channels must be positive and rates non-negative")
    events = generate(a.duration, a.channels, a.rate_hz, a.seed, a.burst_rate_hz)
    with a.output.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["timestamp", "channel"])
        w.writerows(events)
    print(f"Wrote {len(events)} SYNTHETIC events to {a.output}; seed={a.seed}; duration={a.duration}s")

if __name__ == "__main__":
    main()
