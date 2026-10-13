# Architecture

## Overview

CL1 Neural Labs is a layered biological-computing research application.

```
Presentation
    |
    v
Experiment / Interaction Layer
    |
    v
Neural Simulation + Data Layer
    |
    +----> Recording
    +----> Analytics
    +----> Database
    |
    v
Hardware/API boundary
```

## Presentation layer

The React application composes the research workstation from reusable components.

Primary components include:

- `MeaGrid2D`
- `Mea3DView`
- `ExperimentSuite`
- `StimulationWorkbench`
- `AnalyticsSuite`
- `CodePlayground`
- `RecordingController`
- `ResearchLibraryModal`
- `HardwareSettingsModal`
- `DatabaseDatasetHub`

## Simulation layer

`NeuralCultureSimulator` is the central simulation object.

It models a 64-channel array and maintains state for:

- excitability
- refractory periods
- baseline voltage
- synaptic weights
- waveforms
- firing rates
- bursts
- spike events
- stimulation events

The simulator exposes operations used by the UI, including stepping the simulation, resetting the culture, changing playback speed, changing culture parameters, and stimulating channels.

## Analysis layer

The analysis engine operates on simulation events and derived neural activity. Metrics represented by the project include firing rate, active electrodes, branching ratio, burst frequency, entropy, Lempel-Ziv complexity, functional connectivity, and peri-stimulus histograms.

Metrics should be treated as model outputs when generated from simulation data.

## Backend layer

`server.ts` provides an Express server plus WebSocket stream.

The server currently implements a simulated CL1-style overview stream. It uses 64 channels, a 25 kHz nominal sampling configuration, simulated spike/stimulation flags, and REST controls.

## Persistence

The repository contains both application-side data stores and a MySQL schema.

The relational schema separates:

- biological culture metadata
- electrodes
- recordings
- spikes
- stimulation
- experiments
- DSP configuration

This allows raw events and experimental metadata to be queried independently.

## Hardware boundary

The recommended future architecture is adapter-based:

```
interface NeuralSource
       |
       +-- SimulatorSource
       |
       +-- CL1Source
       |
       +-- DatasetReplaySource
```

The UI and analysis layers should consume the common representation rather than depend directly on hardware-specific APIs.

## Design principles

1. **Simulation first:** hardware-independent development remains possible.
2. **Data provenance:** every recording should identify its source.
3. **Explicit hardware boundaries:** simulated endpoints must not masquerade as physical hardware.
4. **Reproducibility:** experiment configuration should be serializable.
5. **Modularity:** visualization, analysis, simulation, storage, and acquisition should remain separable.
