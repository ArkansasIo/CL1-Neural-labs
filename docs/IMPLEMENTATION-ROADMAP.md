# CL1 Neural Labs — Implementation and Validation Roadmap

**Baseline:** build 0.4.x. This roadmap covers the browser UI, seeded software simulator, data tools, and optional CL SDK integration. A module existing does not establish scientific validity or hardware compatibility.

## System boundaries
1. Presentation: React/TypeScript UI and visualizers.
2. Simulation: seeded synthetic signals and virtual channels.
3. Analysis: explicitly described statistics and exploratory metrics.
4. Persistence: CSV/JSON imports and relational metadata schemas.
5. Integration: optional official SDK adapter; simulator endpoints are not a physical device driver.
6. Release: tests, builds, and Pages workflows.

## P0 — reproducibility and truthful labeling
- [ ] Exports include source type: `synthetic`, `imported-unverified`, or `verified-recording`.
- [ ] Persist random seed, model version, sample rate, units, timestamp convention, and parameters.
- [ ] Display synthetic/recorded state in headers, charts, exports, and database records.
- [ ] Reject non-finite values, out-of-range channels, malformed rows, unsupported units, and non-monotonic timestamps.
- [ ] Ensure simulation APIs cannot issue physical hardware commands.

## P1 — software verification
- [ ] Run `npm ci`, `npm run lint`, `npm test`, and `npm run build`.
- [ ] Run `python -m pip install -e "./python[dev]"` and `python -m pytest python/tests sandbox/tests -q`.
- [ ] Add HTTP tests for status/configuration, invalid stimulation payloads, WebSocket lifecycle, and shutdown.
- [ ] Add browser tests for boot, navigation, controls, accessibility, errors, and simulation labels.
- [ ] Add malformed/empty/large dataset fixtures and CSV/JSON round-trip tests.
- [ ] Validate OpenAPI against live development routes and WebSocket frame size/endianness.

## P2 — scientific-analysis quality
- [ ] Define analysis plan before hypothesis testing; avoid post-hoc metric selection.
- [ ] Include controls, repeated trials, exclusions, effect sizes, uncertainty, and sensitivity analysis.
- [ ] Preserve raw data; record software and dataset versions.
- [ ] Validate firing-rate and burst detectors against synthetic ground truth.
- [ ] Use held-out recordings and replication before asserting generalization.
- [ ] Treat functional-connectivity matrices as associations unless causal design justifies more.

## P3 — physical CL1 integration (separately gated)
- [ ] Pin official SDK/API version and cite current vendor documentation.
- [ ] Implement read-only connect/status/receive/disconnect first.
- [ ] Require explicit opt-in, authorization, device allow-list, and audit logging.
- [ ] Review device-specific limits before any stimulation support.
- [ ] Fail closed on timeouts, malformed data, stale connections, unsupported versions, or ambiguous device identity.
- [ ] Validate physical interlocks independently; software checks are not an electrical safety system.

## Definition of done
A feature is complete only when specified, implemented, tested, documented, and validated in its intended environment. A green build does not prove scientific validity or hardware safety.

## Suggested CI gates
| Gate | Evidence |
|---|---|
| Source quality | TypeScript checks; configured Python lint |
| Unit tests | Simulator, parsers, analysis helpers |
| Contracts | REST response schema and WebSocket decoder |
| UI tests | Navigation, controls, accessibility |
| Build | Reproducible production build |
| Data quality | Provenance and malformed-input regressions |
| SDK sandbox | Mock/simulator-only tests |
| Physical deployment | Separate hardware and institutional safety sign-off |
