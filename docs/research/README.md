# Research Notes System

> **STATUS:** implemented  
> **SOURCE:** [Research database](../../src/data/researchDatabase.ts) · [neural simulator](../../src/simulation/neuralCulture.ts) · [CL1 types](../../src/types/cl1.ts)  
> **API:** [TypeScript client](../../src/client/index.ts) · [Express simulator](../../server.ts)  
> **TESTS:** [Python tests](../../python/tests/) · [Sandbox tests](../../sandbox/tests/)  
> **BACK:** [Documentation index](../INDEX.md) · [Research overview](../RESEARCH.md)  
> **NEXT:** [File research map](./FILE-RESEARCH-MAP.md)

This directory records the research purpose, implementation boundary, evidence status, and reproducibility notes for repository files.

## Research-note policy

Every implementation area should have a research record answering:

1. What does the file do?
2. Why does the project need it?
3. What research concept does it represent?
4. What is measured or simulated?
5. What assumptions are made?
6. What is verified versus project-specific?
7. What source code and tests implement it?
8. What are the known limitations?
9. What would validate the model next?

## Evidence flags

| Flag | Meaning |
|---|---|
| `IMPLEMENTED` | Code exists in the repository. |
| `PARTIAL` | A working portion exists, but an integration or production requirement remains. |
| `SIMULATION` | Synthetic/model-generated data only. |
| `REPLAY` | Imported/replayed data rather than a live measurement. |
| `PHYSICAL-READ-ONLY` | Physical-device integration is restricted to observation/recording. |
| `REFERENCE` | Documentation or external knowledge used as a reference. |
| `UNVERIFIED` | Project assumption requiring validation. |
| `PLANNED` | Not implemented yet. |

These are research/documentation labels. They are **not hardware permissions** and do not enable stimulation or physical-device control.

## Research provenance rule

A result must be labeled by source:

`synthetic_model` → `dataset_replay` → `sdk_simulator` → `physical_cl1`

Do not present synthetic or replayed signals as biological measurements.

## File navigation

Use the [File Research Map](./FILE-RESEARCH-MAP.md) to move from a research note to the exact source file, tests, and implementation documentation. Every research record should provide a `BACK` link to its parent document.

## Current research priorities

- deterministic simulator seeds and repeatability
- signal-processing validation
- dataset provenance
- comparison with reference electrophysiology datasets
- official CL SDK compatibility testing
- read-only physical CL1 recording
- independent safety review before any physical stimulation
- benchmark separation between biological, simulated, and neuromorphic systems