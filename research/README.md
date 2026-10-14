# CL1 Neuro Lab research resource index

This repository combines a browser-based educational simulator with research scripts. Keep synthetic outputs clearly labelled; do not present them as measurements from living tissue or as validated CL1 hardware behavior.

## Official CL API resources

- Developer guide: https://docs.corticallabs.com/ — recording, spike/stim events, loop timing, and simulator overview.
- API reference: https://docs.corticallabs.com/cl — `cl.open()`, recording, stimulation design, and timed loops.
- Simulator source API: https://docs.corticallabs.com/cl/sim — random/replay data sources and custom simulation adapters.
- Playback: https://docs.corticallabs.com/cl/playback — inspect recordings and event streams.

## Research domains represented by the scripts

1. Extracellular electrophysiology: spike counts, per-channel firing rates, active channels, burst-bin summaries, and raster exports.
2. Population dynamics: activity synchrony proxies and population-event timing.
3. Closed-loop experiment design: target-rate policy, deadband, action spacing, and rate limiting. Policy is simulated and never connects to hardware.
4. Reproducibility: JSON experiment statements record model assumptions, parameters, random seeds, timestamps, and data provenance.
5. Comparative model families: Poisson baseline, refractory Poisson, and burst-modulated synthetic activity. These are deliberately simple baselines, not mechanistic models of neurons.

## Safety and provenance

- Never treat generated data as biological evidence.
- Do not connect these scripts to a physical device without a separate review of official documentation, device-specific limits, permissions, and safety controls.
- Preserve source recording metadata and consent/provenance information when analysing real datasets.
- Do not commit private recordings or identifying data to a public repository.
