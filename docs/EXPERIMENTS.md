# Experiments

## Existing experiment families

### DishBrain-style Pong

The repository contains a Pong experiment designed around sensory stimulation and motor-channel responses.

The purpose is to explore closed-loop learning concepts in a controlled simulation.

Important metrics include:

- score
- hits
- misses
- current rally
- longest rally
- trial history

### Associative conditioning

The conditioning module represents paired stimuli and response probability.

Parameters include:

- conditioned-stimulus channels
- unconditioned-stimulus channels
- pairing delay
- trial count
- response probability
- potentiation model
- pairing history

These are computational models and should not be interpreted as evidence of biological conditioning in the simulator.

### Maze navigation

The maze model maps sensory and motor channels to navigation.

Tracked quantities include:

- steps
- successful reaches
- trial count
- entropy reduction
- directional motor channels

## Experimental discipline

Each experiment should have:

```
Configuration
    -> Run
    -> Events
    -> Metrics
    -> Dataset
    -> Interpretation
```

Avoid changing parameters during a run unless the experiment explicitly tests adaptation to changing conditions.

## Baselines

For meaningful research comparisons, establish:

- random baseline
- fixed-policy baseline
- simulator baseline
- parameterized neural baseline
- external dataset baseline where legally and scientifically appropriate

## Reproducibility

Experiments should record a random seed whenever stochastic behavior is involved.

Results should distinguish:

- simulated
- replayed
- imported biological
- live physical-device

data sources.
