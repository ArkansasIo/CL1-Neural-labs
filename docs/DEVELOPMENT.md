# Development Guide

## Prerequisites

Recommended environment:

- Node.js compatible with the package dependencies
- Bun for the repository lockfile and scripts
- Git
- A modern browser

Optional:

- MySQL 8+
- Python 3
- pandas
- access to the official Cortical Labs development/API environment for future hardware integration

## Install

```bash
bun install
```

## Run the frontend

```bash
bun run dev
```

The Vite configuration and package scripts use port 3000.

## Build

```bash
bun run build
```

## Type checking

```bash
bun run lint
```

## Backend simulation

The repository also contains `server.ts`, an Express/WebSocket server that models a CL1-style streaming interface.

Run it through the project's TypeScript runtime tooling as appropriate for the local environment. Keep the backend simulation separate from production physical-device control.

## Code organization

Use the existing boundaries:

- UI: `src/components/`
- simulation: `src/simulation/`
- types: `src/types/`
- research data: `src/data/`
- database: `database/`
- browser assets: `public/`

New neural algorithms should normally live under `src/simulation/` or a new dedicated analysis module rather than being embedded directly into UI components.

## Adding a new experiment

1. Define an experiment state interface.
2. Define input and output channels.
3. Implement deterministic configuration.
4. Record all relevant events.
5. Add an experiment component.
6. Add analytics.
7. Add dataset/export support.
8. Document assumptions and limitations.

## Data integrity

Do not overwrite source datasets merely to normalize them. Preserve the original dataset and create derived datasets with explicit names.

For every experimental result, record:

- source type
- simulator version
- parameters
- random seed when applicable
- experiment type
- timestamp
- dataset provenance

## Future test strategy

The project should add automated tests for:

- simulator determinism with a fixed seed
- spike detection
- stimulation event handling
- recording lifecycle
- experiment scoring
- database schema migrations
- WebSocket message validation
- REST input validation
- serialization/deserialization

## Pull requests

Before merging substantial changes:

```bash
bun run lint
bun run build
```

Also manually verify the principal MEA views and experiment workflows.
