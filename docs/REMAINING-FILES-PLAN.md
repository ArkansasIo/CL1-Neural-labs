# Remaining Files and Implementation Plan

This plan distinguishes missing files from missing implementation or validation. It is intentionally not a promise that creating placeholder files completes a feature.

## P0 — release correctness

- [x] `scripts/audit_repository.py` — static completeness checker.
- [x] `python/cl1_neural_lab/types.py` — shared simulator types.
- [x] `python/cl1_neural_lab/neural_culture.py` — deterministic software simulator.
- [x] `python/cl1_neural_lab/analysis_engine.py` — explicit synthetic analysis metrics.
- [x] `python/cl1_neural_lab/database_store.py` — in-memory SQLite test store.
- [x] `python/cl1_neural_lab/server.py` — console entry point declared by `pyproject.toml`.
- [x] `python/README.md` — package README declared by `pyproject.toml`.
- [x] `python/tests/test_cli.py` — CLI output and argument validation tests.
- [x] `python/tests/test_maze.py` — pathfinding and maze-generation tests.
- [x] `python/tests/test_plugins.py` — plugin lifecycle and rollback tests.
- [x] `python/tests/test_virtual_hardware.py` — recording, stimulation, and physical-mode safety tests.
- [x] `docs/hardware/CHANNEL-MAP.md` — missing channel-map reference.
- [x] `docs/research/FILE-RESEARCH-MAP.md` — missing research file-map reference.
- [x] `python/tests/test_simulator.py` — simulator and safety regression tests.
- [ ] Confirm release workflow passes on GitHub Actions.
- [ ] Run TypeScript type-check and production build on the latest commit.

## P1 — API and integration correctness

- [x] `docs/API-CONTRACTS.md` — documented development endpoints and WebSocket framing.
- [ ] Add endpoint-level tests for the TypeScript server and Python cluster server.
- [ ] Add protocol decoder tests for binary frame size, endianness, flags, malformed frames, and versioning.
- [x] Add initial OpenAPI document for verified TypeScript REST routes; validate and expand it as routes evolve.
- [ ] Add integration tests for client reconnects, disconnect cleanup, and server shutdown.
- [ ] Verify package scripts and dependency lockfiles stay synchronized.

## P1 — research data quality

- [ ] Add fixtures covering valid, malformed, truncated, and mislabeled recording files.
- [ ] Test provenance propagation through import, analysis, export, and database storage.
- [ ] Add CSV/JSON export round-trip tests and schema migration tests.
- [ ] Document simulator assumptions and distinguish demonstration metrics from scientifically validated estimates.

## P2 — user interface quality

- [ ] Add browser tests for initial boot overlay, navigation, modals, settings, keyboard behavior, and responsive layouts.
- [ ] Add component tests for MEA grids, experiment controls, error states, and safe defaults.
- [ ] Add accessibility checks for focus management, labels, contrast, and keyboard navigation.

## Safety boundary

This repository's virtual models must not be described as biological validation or physical-device drivers. Physical CL1 operation remains out of scope until official interface compatibility, authorization, fail-closed behavior, and independent hardware interlocks are verified.
