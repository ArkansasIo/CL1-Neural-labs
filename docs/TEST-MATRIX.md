# Verification Matrix

Use this matrix to track evidence, not merely the existence of test files.

| Area | Current check | Additional verification needed |
|---|---|---|
| Python simulator | `python/tests/test_simulator.py`, `test_core.py` | Boundaries, determinism, long-run stability |
| Python analysis | math-model tests and related modules | Ground-truth fixtures, unit/timestamp consistency |
| Virtual hardware | virtual-hardware and sandbox guard tests | Fail-closed behavior for malformed/stale commands |
| Database | SQL schemas and database-store tests | Fresh install, migrations, foreign keys, rollbacks |
| TypeScript API | repository contract tests | Live endpoint contract and negative tests |
| WebSocket | overview endpoint contract | Frame length, endianness, reconnect, backpressure, malformed frames |
| Frontend | type-check and Vite build | Browser tests for navigation, error states, accessibility |
| Data import/export | sample CSV files | Malformed files, headers, units, duplicate times, round trips |
| OpenAPI | `openapi.yaml` | Validate against actual responses in CI |
| GitHub Pages | Pages workflow | Published URL, asset paths, 404 fallback |
| SDK simulator | `scripts/cl1_sdk_simulator_smoke.py` | Pin SDK and isolate environment |
| Physical CL1 | Not established by simulator tests | Authorized device test, vendor interface, safety approval |

## Local verification commands

```bash
npm ci
npm run lint
npm test
npm run build
python -m pip install -e "./python[dev]"
python -m pytest python/tests sandbox/tests -q
python scripts/audit_repository.py
```

Run Python commands from repository root. Physical integration is not tested unless the exact authorized device, SDK version, procedure, and result are recorded.
