# Alpha and Beta Test Plan

<!-- STATUS: IMPLEMENTED — test specification | SOURCE: python/tests/; scripts/; package.json; .github/workflows/ | API: docs/UI-GUI-API-ARCHITECTURE.md | BACK: ../README.md | NEXT: RELEASE.md; SANDBOX-VALIDATION.md -->

## Alpha gate

Run from the repository root:

```bash
npm ci
npm run lint
npm run build
python -m pip install -e "./python[dev]"
python -m unittest discover -s python/tests -v
```

If the repository lockfile is Bun-managed, use `bun install --frozen-lockfile` and `bun run build` / `bun run lint` instead of npm commands. The lockfile and package manager must be chosen consistently for a given CI run.

## Beta gate

In addition to Alpha:

1. Run Python tests on supported operating systems and Python versions.
2. Run the local project simulator smoke tests.
3. Run the official CL SDK simulator smoke script only in an environment with the vendor SDK installed and explicit confirmation that it is the simulator.
4. Validate replay data provenance and export metadata.
5. Check documentation links, build identity, license notices, and known limitations.
6. Confirm CI did not access physical CL1 hardware.

## Optional official SDK simulator check

```bash
python -m pip install cl-sdk
python scripts/cl1_sdk_simulator_smoke.py
```

This should only be run where the SDK is configured to use the simulator. The official SDK documents `cl.open()`, `neurons.record(stop_after_seconds=...)`, and `recording.wait_until_stopped()`. The SDK simulator produces synthetic or replayed data and is not a biological experiment.

## Manual physical-hardware validation

This is outside CI and requires authorized access, vendor-supported setup, institutionally approved procedures, and a separate safety review. Keep initial integration read-only. Do not use release testing to issue stimulation.

## Result reporting template

- Commit:
- Runtime / OS:
- Commands:
- Passed:
- Failed:
- Skipped:
- SDK mode (project simulator / SDK simulator / replay / physical read-only):
- Evidence / logs:
- Remaining risks:
