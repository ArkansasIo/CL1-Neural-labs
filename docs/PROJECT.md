# CL1 Neural Labs — GitHub Project Plan

<!-- STATUS: IMPLEMENTED — project charter | SOURCE: src/; python/; database/; sandbox/; sdk/ | API: UI-GUI-API-ARCHITECTURE.md | TESTS: TESTING-RELEASE.md | BACK: ../README.md | NEXT: RELEASE.md; DOCUMENTATION-MANIFEST.md -->

## Project objective

Build a reproducible research/prototyping platform around CL1-style neural-computing workflows while keeping simulation, replay, SDK simulation, and physical CL1 integration explicitly separated.

## Workstreams

| Workstream | Current target | Evidence |
|---|---|---|
| Core UI | React/TypeScript research studio | IMPLEMENTED |
| Neural simulator | 64-channel MEA software model | IMPLEMENTED / SIMULATION |
| Experiments | Pong, conditioning, maze, analytics | IMPLEMENTED / SIMULATION |
| Data | SQL schemas, datasets, provenance | IMPLEMENTED |
| SDK simulator | Official SDK simulator boundary | PARTIAL / UNVERIFIED |
| Physical CL1 | Read-only adapter boundary | PARTIAL / PHYSICAL-READ-ONLY |
| Safety | Software E-stop and stimulation gates | IMPLEMENTED / SOFTWARE-ONLY |
| Authentication | Research authorization primitives | PARTIAL |
| Documentation | Linked source/research/release docs | IMPLEMENTED |
| Release engineering | Alpha → beta → release gates | IMPLEMENTED |

## Milestones

### Alpha

- Source tree complete enough to build.
- TypeScript type-check passes.
- Production frontend build passes.
- Python unit tests pass.
- Safety-boundary tests pass.
- Documentation and license are present.

### Beta

- Alpha gates remain green.
- Simulator workflows execute deterministically where specified.
- SDK-simulator smoke workflow is documented and validated.
- Replay workflow is validated.
- Release metadata matches the source tree.
- Known limitations are documented.

### Release

- Beta evidence is recorded.
- No known release-blocking test failure.
- Build identity is synchronized.
- Changelog/release notes are published.
- Software release is explicitly distinguished from physical-hardware validation.

## Suggested GitHub Project board

Columns: Backlog → Research → Implementation → Alpha → Beta → Release Candidate → Released

Suggested labels: research, simulation, sdk, physical-read-only, safety, testing, documentation, release, bug, enhancement, unverified

## Definition of done

A task is complete only when its implementation, tests, documentation, evidence level, and source-file navigation are updated together.
