# Remaining Files and Implementation Plan

This plan distinguishes missing files from missing implementation or validation. It is intentionally not a promise that creating placeholder files completes a feature.

## P0 — release correctness

- [x] `scripts/audit_repository.py` — static completeness checker.
- [x] `python/cl1_neural_lab/types.py` — shared simulator types.
- [x] `python/cl1_neural_lab/neural_culture.py` — deterministic software simulator.
- [x] `python/cl1_neural_lab/analysis_engine.py` — explicit synthetic analysis metrics.
- [x] `python/cl1_neural_lab/database_store.py` — in-memory SQLite test store.
- [x] `python/tests/test_simulator.py` — simulator and safety regression tests.
- [ ] Confirm release workflow passes on GitHub Actions.
- [ ] Run TypeScript type-check and production build on the latest commit.

## P1 — API and integration correctness

- [x] `docs/API-CONTRACTS.md` — documented development endpoints and WebSocket framing.
- [ ] Add endpoint-level tests for the TypeScript server and Python cluster server.
- [ ] Add protocol decoder tests for binary frame size, endianness, flags, malformed frames, and versioning.
- [ ] Add API schema validation and generate an OpenAPI document after routes are verified.
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
