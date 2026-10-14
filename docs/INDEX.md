# CL1 Neural Labs Documentation Index

> [Manifest](./DOCUMENTATION-MANIFEST.md) · [Navigation Convention](./FILE-NAVIGATION.md) · [Missing-file audit](./MISSING-FILES-AUDIT.md) · [Remaining files plan](./REMAINING-FILES-PLAN.md) · [API contracts](./API-CONTRACTS.md) · [OpenAPI spec](../openapi.yaml) · [Audit tool](../scripts/audit_repository.py) · [Project README](../README.md)

## Application

- [UI / GUI / API architecture](./UI-GUI-API-ARCHITECTURE.md) → [App.tsx](../src/App.tsx) → [StudioCommandBar.tsx](../src/components/StudioCommandBar.tsx)
- [Build identity](./BUILD-IDENTITY.md) → [buildInfo.ts](../src/config/buildInfo.ts) → [BuildIdentity.tsx](../src/components/BuildIdentity.tsx)
- [License](./LICENSE.md) → [LICENSE](../LICENSE) → [LicenseCredits.tsx](../src/components/LicenseCredits.tsx)

## Neuroscience research and mathematics

- [Theoretical framework](./research/THEORETICAL-FRAMEWORK.md) — graph models, activity dynamics, spike trains, bursts, connectivity, plasticity, entropy.
- [Mathematical specification](./research/MATHEMATICAL-SPECIFICATION.md) — algebra, calculus, numerical integration, statistics, proposed function contracts.
- [Research references](./research/RESEARCH-REFERENCES.md) — official CL API docs and primary neuroscience literature.
- [Validation and experiment protocol](./research/VALIDATION-AND-EXPERIMENT-PROTOCOL.md) — hypotheses, controls, reproducibility, provenance, acceptance criteria.
- [Research file map](./research/FILE-RESEARCH-MAP.md) — repository research assets and interpretation cautions.
- [Experiments](./EXPERIMENTS.md) — Pong, associative conditioning, maze experiments.
- [Neurocognitive symbolic architecture](./NEUROCOGNITIVE-SYMBOLIC-ARCHITECTURE.md) — software analogy and explicit capability limits.

## Hardware and sandbox

- [Real CL1 integration](./REAL-CL1-INTEGRATION.md) → [real adapter](../sdk/python/cl1_real_adapter.py)
- [Sandbox validation](./SANDBOX-VALIDATION.md) → [sandbox runner](../sandbox/run_sdk_sandbox.py)
- [Hardware documentation](./hardware/README.md) → [virtual hardware](../python/cl1_neural_lab/virtual_hardware.py)
- [Channel map](./hardware/CHANNEL-MAP.md) — software channel model; not a vendor-verified physical wiring map.

## Data and security

- [Authorization](./AUTHORIZATION.md) → [auth module](../python/cl1_neural_lab/auth.py) → [auth client](../src/client/authClient.ts)
- [Data model](./DATA-MODEL.md) → [database schema](../database/schema.sql)
- [API contracts](./API-CONTRACTS.md) — development REST and WebSocket contracts.
