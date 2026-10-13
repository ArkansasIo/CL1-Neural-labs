# SDK and Toolchain Integration

This directory documents SDK boundaries and supported development toolchains for CL1-Neural-labs.

## Toolchain A — Python research and device SDK

- Project Python package: `python/cl1_neural_lab/`
- Official CL SDK package: `cl-sdk` (install only when needed and follow vendor setup)
- Virtual/replay testing: default for CI and ordinary development
- Physical CL1 access: optional, explicitly enabled, and only through official APIs

The official API is accessed through `cl.open()`; recording, timestamps, data streams, and recording replay are documented by Cortical Labs. See the official [Developer Guide](https://docs.corticallabs.com/) and [CL API reference](https://docs.corticallabs.com/cl).

## Toolchain B — TypeScript web and service SDK

- UI: React + TypeScript + Vite
- Service/client contracts: `src/client/`
- Build and type check: `bun run build`, `bun run lint`
- Cluster REST client remains separate from any physical device adapter.

## Integration rules

1. Tag all data with provenance: `simulator`, `replay`, `imported`, or `physical_read_only`.
2. Never assume virtual channel layout is a physical connector pinout.
3. Keep physical control disabled unless a dedicated adapter has been implemented, reviewed, and tested on authorized hardware.
4. Never silently fall back from a failed physical connection to simulated data; surface the source clearly.
5. Keep vendor API objects inside the Python adapter and expose stable project-owned interfaces to the UI.
6. Do not place credentials or device tokens in source control.

## Current status

The project simulator, analysis and client layers exist. The official CL SDK integration described here is a planned optional adapter, not yet verified as implemented in this repository. The database SQL schema exists, but the current Python store is in-memory rather than end-to-end MySQL-backed.
