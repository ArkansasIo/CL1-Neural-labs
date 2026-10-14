# Experiment Plan Templates

Use these as starting points. Adapt them to the scientific question and any relevant ethics/safety process.

## A. Simulator regression
**Question:** Do fixed seed and parameters produce stable, schema-valid output?  
**Data:** Synthetic only.  
**Control:** Same seed, runtime, and model version.  
**Primary outcome:** repeatability of documented deterministic fields.  
**Negative tests:** invalid timestep/channel/parameters, empty output, serialization round trip.  
**Conclusion allowed:** software behavior is repeatable under tested conditions. Not allowed: output matches living neurons.

## B. Spike detector validation
**Question:** How well does a detector recover events in traces with known synthetic ground truth?  
**Data:** Generated waveforms with documented noise and event times.  
**Metrics:** precision, recall, F1, timing error, performance across signal-to-noise levels.  
**Controls:** noise-only trace and event-free intervals.  
**Required report:** detector parameters, threshold, refractory constraints, errors across seeds.  
**Conclusion allowed:** detector performance on the specified synthetic benchmark.

## C. Activity change in imported recording
**Question:** Is a pre-defined metric different between pre/post windows?  
**Data:** Properly sourced recording with acquisition metadata.  
**Controls:** Baseline windows, artifact annotations, and negative-control intervals/channels where justified.  
**Replication:** determined by experimental design; avoid pseudo-replication across electrodes or time bins.  
**Report:** effect size, confidence interval, sample count, exclusions, detector settings, multiple-testing correction.  
**Conclusion allowed:** only the effect measured in this dataset and design.

## D. Closed-loop policy simulation
**Question:** Does a simulated controller meet action-rate and target-error constraints?  
**Data:** Synthetic environment or official SDK simulator; no physical device by default.  
**Safety tests:** action budget, deadband, minimum interval, invalid targets, stop condition, timeout, deterministic replay.  
**Metrics:** target error, action count, latency, constraint violations.  
**Conclusion allowed:** controller performance only in the stated simulator.
