# CL1 Neural Labs Wiki — Home

<!-- STATUS: IMPLEMENTED — wiki content draft | SOURCE: README.md; docs/INDEX.md; docs/RESEARCH.md | TESTS: TESTING-RELEASE.md | BACK: ../README.md | NEXT: ABOUT-GITHUB.md; PROJECT.md -->

## About

CL1 Neural Labs is a research/prototyping environment for exploring CL1-style biological neural computing through software simulation, neural-signal visualization, closed-loop experiments, analytics, datasets, and controlled SDK integration boundaries.

## Wiki map

| Topic | Documentation |
|---|---|
| Architecture | [Architecture](ARCHITECTURE.md) |
| Development | [Development](DEVELOPMENT.md) |
| CL1 integration | [CL1 Integration](CL1-INTEGRATION.md) |
| Official SDK boundary | [Real CL1 Integration](REAL-CL1-INTEGRATION.md) |
| Hardware model | [Hardware](hardware/README.md) |
| Sandbox | [Sandbox Validation](SANDBOX-VALIDATION.md) |
| Experiments | [Experiments](EXPERIMENTS.md) |
| Research | [Research](RESEARCH.md) |
| Data model | [Data Model](DATA-MODEL.md) |
| Authorization | [Authorization](AUTHORIZATION.md) |
| UI / GUI / API | [UI / GUI / API Architecture](UI-GUI-API-ARCHITECTURE.md) |
| Release engineering | [Release](RELEASE.md) |
| Testing | [Alpha / Beta Testing](TESTING-RELEASE.md) |
| File navigation | [File Navigation](FILE-NAVIGATION.md) |

## Evidence levels

- IMPLEMENTED — implemented in the repository.
- PARTIAL — implemented but with known gaps.
- SIMULATION — software model only.
- REPLAY — recorded-data workflow.
- PHYSICAL-READ-ONLY — physical integration boundary restricted to acquisition/read-only workflows.
- REFERENCE — documentation or external reference.
- UNVERIFIED — requires compatibility or hardware validation.
- PLANNED — not implemented.

These labels describe evidence and implementation status. They are not hardware permissions.

## Research provenance

synthetic_model → dataset_replay → sdk_simulator → physical_cl1

Moving to a higher-fidelity stage requires separate validation. Simulator results must not be represented as biological measurements.

## Release policy

A release can certify the software package's tests and documentation state. It does not certify biological experiments, physical stimulation, hardware safety, or regulatory/institutional approval.

## License

MIT for this repository, subject to LICENSE.md. Third-party software and the official Cortical Labs SDK remain subject to their own licenses and terms.
