# Data Model

## Core entities

The MySQL schema defines the following principal entities.

### cultures

Describes biological culture metadata.

### culture_subpopulations

Stores cellular subpopulation characteristics associated with a culture.

### electrodes

Represents the 64-channel MEA geometry and channel state.

### recording_sessions

Represents an acquisition session and its summary metrics.

### spike_events

Stores individual detected extracellular spike events.

### stimulation_events

Stores stimulation events associated with recordings.

### closed_loop_experiments

Stores experiment-level outcomes and telemetry.

### dsp_filter_configs

Stores signal-conditioning and spike-detection configuration.

## Relationship model

```
culture
  |
  +--> culture_subpopulations
  |
  +--> recording_sessions
           |
           +--> spike_events
           |
           +--> stimulation_events
           |
           +--> closed_loop_experiments

electrodes
  |
  +--> spike_events
  +--> stimulation_events
```

## Datasets

The repository currently includes example CSV datasets for:

- biphasic stimulation logs
- DishBrain-style Pong trials
- human-culture telemetry
- spike raster data

Dataset names and provenance should be preserved when creating derived datasets.

## Configuration

Database configuration is intentionally separated from source code through:

- `database/mysql.config.json`
- `database/database.env.example`

Passwords and production credentials must never be committed.
