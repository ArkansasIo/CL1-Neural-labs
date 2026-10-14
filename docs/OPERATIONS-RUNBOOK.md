# Development Operations Runbook

## Environment
- Node.js version supported by the repository's Vite/TypeScript versions.
- Python 3.11+ for the Python package.
- The simulator/test path should work without a live MySQL instance; use an isolated development DB for SQL integration.
- Default to simulation. Never put real credentials in tracked configuration.

## Setup and checks

```bash
npm ci
npm run lint
npm test
npm run build
python -m pip install -e "./python[dev]"
python -m pytest python/tests sandbox/tests -q
```

Review intentional lockfile changes alongside package metadata. Do not silently substitute an unlocked dependency install in CI.

## Run

```bash
npm run dev
```

The README describes a development server on port 3000. Use `npm run dev:vite` for frontend-only development. Check `server.ts` and Vite configuration if routes or ports changed.

## Troubleshooting

### Port occupied
Identify the process listening on the configured port and stop it only if it is your development process. Do not indiscriminately kill unrelated services.

### Dependency install fails
Check Node/npm versions; run `npm ci` against the committed lockfile; inspect the first dependency error; do not force incompatible peer dependencies without a documented reason.

### TypeScript/build failure
Run `npm run lint` first, fix the earliest error, and verify import path casing and tracked source files.

### Python import failure
Install with `python -m pip install -e "./python[dev]"`; run tests from repository root and inspect the first missing module in the traceback.

### Data looks synthetic
That is expected in simulator mode. Check provenance labels; never interpret generated signals as physical recordings.

### SDK does not connect
Check official docs, supported SDK version, authorization, device identity, and network setup. Do not use stimulation as a connectivity test. Remain in simulation/read-only mode until reviewed.

## Release checklist
- [ ] Intended commit reviewed and working tree clean.
- [ ] npm install, lint, tests, and production build pass.
- [ ] Python tests and static audit pass.
- [ ] Dataset sources and provenance labels reviewed.
- [ ] API/WebSocket contracts current.
- [ ] No secrets, private recordings, or identifying data committed.
- [ ] Pages workflow and deployed routes checked.
- [ ] Known limitations documented.
- [ ] Physical integration disabled unless separately approved.
