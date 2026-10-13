# CL1 Neural Labs Documentation Index

> [Manifest](./DOCUMENTATION-MANIFEST.md) · [Navigation Convention](./FILE-NAVIGATION.md) · [Project README](../README.md)

## Application

- [UI / GUI / API architecture](./UI-GUI-API-ARCHITECTURE.md) → [App.tsx](../src/App.tsx) → [StudioCommandBar.tsx](../src/components/StudioCommandBar.tsx)
- [Build identity](./BUILD-IDENTITY.md) → [buildInfo.ts](../src/config/buildInfo.ts) → [BuildIdentity.tsx](../src/components/BuildIdentity.tsx)
- [License](./LICENSE.md) → [LICENSE](../LICENSE) → [LicenseCredits.tsx](../src/components/LicenseCredits.tsx)

## Hardware and sandbox

- [Real CL1 integration](./REAL-CL1-INTEGRATION.md) → [real adapter](../sdk/python/cl1_real_adapter.py)
- [Sandbox validation](./SANDBOX-VALIDATION.md) → [sandbox runner](../sandbox/run_sdk_sandbox.py)
- [Hardware documentation](./hardware/README.md) → [virtual hardware](../python/cl1_neural_lab/virtual_hardware.py)

## Data and security

- [Authorization](./AUTHORIZATION.md) → [auth module](../python/cl1_neural_lab/auth.py) → [auth client](../src/client/authClient.ts)
- [Data model](./DATA-MODEL.md) → [database schema](../database/schema.sql)
