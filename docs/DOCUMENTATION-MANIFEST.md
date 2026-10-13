# CL1 Neural Labs Documentation Manifest

> [Project README](../README.md) · [Source tree](../src/) · [Server](../server.ts) · [Build identity](./BUILD-IDENTITY.md)

This manifest defines the documentation-to-source navigation convention.

## Navigation flags

Each implementation document should identify STATUS, SOURCE, API, TESTS, BACK, and NEXT. These are descriptive metadata, not build or hardware permissions.

## Core documents

| Document | Source | Related |
|---|---|---|
| [Build Identity](./BUILD-IDENTITY.md) | [buildInfo.ts](../src/config/buildInfo.ts) | [BuildIdentity.tsx](../src/components/BuildIdentity.tsx) |
| [License](./LICENSE.md) | [LICENSE](../LICENSE) | [Build Identity](./BUILD-IDENTITY.md) |
| [UI / GUI / API](./UI-GUI-API-ARCHITECTURE.md) | [App.tsx](../src/App.tsx) | [StudioCommandBar.tsx](../src/components/StudioCommandBar.tsx) |
| [Sandbox Validation](./SANDBOX-VALIDATION.md) | [run_sdk_sandbox.py](../sandbox/run_sdk_sandbox.py) | [Sandbox README](../sandbox/README.md) |
| [Authorization](./AUTHORIZATION.md) | [auth.py](../python/cl1_neural_lab/auth.py) | [authClient.ts](../src/client/authClient.ts) |
| [Real CL1 Integration](./REAL-CL1-INTEGRATION.md) | [cl1_real_adapter.py](../sdk/python/cl1_real_adapter.py) | [cl1_real_record.py](../scripts/cl1_real_record.py) |
| [Hardware](./hardware/README.md) | [virtual_hardware.py](../python/cl1_neural_lab/virtual_hardware.py) | [CHANNEL-MAP.md](./hardware/CHANNEL-MAP.md) |

## Source navigation

- [Application shell](../src/App.tsx)
- [Server](../server.ts)
- [CL1 types](../src/types/cl1.ts)
- [Simulation](../src/simulation/neuralCulture.ts)
- [Python package](../python/cl1_neural_lab/)
- [Database schema](../database/schema.sql)
- [Authentication schema](../database/auth_schema.sql)
- [Sandbox](../sandbox/)
- [SDK adapter](../sdk/python/cl1_real_adapter.py)

## Linking rule

When documentation discusses an implementation detail, link the exact repository file. Source files should link back to the document that defines their behavior when practical.
