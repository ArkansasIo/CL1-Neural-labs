# Research File Map

This index links research themes to the source files that currently implement or document them. It is a navigation aid, not a claim that each computational model is scientifically validated.

## Neural signal simulation and analysis

- `src/simulation/neuralCulture.ts` — primary TypeScript neural-culture simulator.
- `src/simulation/analysisEngine.ts` — TypeScript analysis helpers, if present in the active source tree.
- `python/cl1_neural_lab/neural_culture.py` — deterministic Python software simulator.
- `python/cl1_neural_lab/analysis_engine.py` — synthetic activity matrix and demonstration metrics.
- `database/datasets/` — example spike, stimulation, Pong, and telemetry CSV datasets.
- [Research provenance](../../docs/RESEARCH.md) and [data model](../../docs/DATA-MODEL.md).

## Experiments and teaching

- `src/simulation/pongExperiment.ts` — Pong experiment logic.
- `src/simulation/conditioningExperiment.ts` — associative-conditioning experiment logic.
- `src/components/MazeTeachingTool.tsx` and `python/cl1_neural_lab/maze.py` — maze/pathfinding teaching.
- `python/cl1_neural_lab/education.py` — math teaching and symbolic exercise utilities.
- `python/cl1_neural_lab/neurocognitive.py` — virtual symbolic reasoning demo.

## Virtual hardware and integration boundary

- `python/cl1_neural_lab/virtual_hardware.py` — software-only hardware profile and state machine.
- `python/cl1_neural_lab/cluster.py` and `cluster_server.py` — virtual cluster.
- `sdk/python/cl1_real_adapter.py` — integration scaffolding; inspect its status and requirements before use.
- [Real CL1 integration](../../docs/REAL-CL1-INTEGRATION.md), [sandbox validation](../../docs/SANDBOX-VALIDATION.md), and [channel map](../hardware/CHANNEL-MAP.md).

## Provenance and persistence

- `python/cl1_neural_lab/research_provenance.py` — explicit source labels and metadata.
- `python/cl1_neural_lab/biological_recording.py` — optional SDK-backed, read-only recording inspection.
- `database/schema.sql`, `database/biological_measurements.sql`, and `database/seed_dataset.sql` — SQL schema and seed data.
- `database/cl1_database_connector.py` — connector and dataset I/O scaffolding.

## Interpretation warning

Synthetic data, teaching examples, and symbolic outputs are not biological measurements. Physical-device claims require independently verified source metadata and validated official-device integration. Check each file's current implementation before relying on this index for an operational workflow.
