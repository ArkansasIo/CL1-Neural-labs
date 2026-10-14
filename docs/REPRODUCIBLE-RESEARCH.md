# Reproducible Research Protocol

## Purpose
Keep software demonstrations, imported recordings, and verified physical-device data separate. A simulator can be useful for software tests without being a validated model of living tissue.

## Minimum experiment record
- Unique experiment/run ID and objective/hypothesis.
- Provenance: `synthetic`, `imported-unverified`, or `verified-recording`.
- Dataset URI/checksum; do not commit private recordings.
- Source, citation/access date, where applicable.
- Application commit/build and simulator/model version.
- Parameters, channel map, units, sampling rate, filters, and timestamp convention.
- Random seed for stochastic generation.
- Inclusion/exclusion criteria and failure conditions.
- Start/end timestamps in UTC and notes.
- Analysis script version, output checksums, deviations from plan.

## Workflow
1. State the question and primary outcome before inspecting results.
2. Label synthetic, imported, and verified data.
3. Validate schema, timestamp order, channel IDs, units, missing values, and provenance.
4. Predefine bin widths, filters, detector thresholds, burst definition, exclusions, and statistics.
5. Include controls and repeats where appropriate; do not treat time bins from one run as independent biological replicates.
6. Report sample counts, uncertainty, effect sizes, and sensitivity to parameters.
7. Link each derived result to immutable raw input and exact code/parameters.
8. Export raw data unchanged; store transformed arrays and plots separately.
9. Separate observations, interpretation, and speculation.

See `research/examples/experiment-statement.example.json` and `research/experiment-statement.schema.json` for machine-readable metadata.

## Analysis cautions
- Firing rate is a summary, not a complete description of activity.
- Burst definitions depend on algorithm and dataset; state the definition.
- Correlation/co-activity alone does not establish directed or causal connectivity.
- Multiple comparisons can inflate false positives; choose corrections appropriate to the design.
- Cells, electrodes, channels, recordings, and independent cultures are not interchangeable replication units.
- Synthetic traces are not evidence of biological response, cognition, learning, or sentience.
- A change in Pong score alone does not establish a specific biological learning mechanism.

## Ethics and privacy
Follow relevant institutional ethics, consent, biosafety, data management, and privacy requirements. Keep identifying information out of the public repository, and share de-identified data only when permissions allow.
