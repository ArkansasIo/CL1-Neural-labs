# Toolchains and SDKs

## Purpose

This project uses two primary toolchains, with an optional vendor SDK layer.

### 1. Python toolchain

Use Python for simulation, analysis, reproducible experiment runners, data import/export, cluster orchestration, and the future official CL SDK adapter.

Typical commands from repository root:

```bash
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -e "python[dev]"
python -m pytest python/tests
```

If the editable-install metadata or development extras are not yet configured in the checked-out revision, install test dependencies from `python/requirements.txt` and run tests with the repository root on `PYTHONPATH`. Do not treat this note as evidence that tests have passed.

### 2. TypeScript toolchain

```bash
bun install
bun run lint
bun run build
```

Use the Node/Bun version pinned or documented by the repository when available. Do not update major tool versions without running the full type check and production build.

### Optional vendor SDK

The official Cortical Labs SDK is Python-oriented and documents both physical CL1 interaction and a local simulator. Use the simulator for baseline integration work; use physical access only with authorization and the vendor's current operating instructions.

- [Cortical Labs Developer Guide](https://docs.corticallabs.com/)
- [CL API reference](https://docs.corticallabs.com/cl)
- [Simulator source interfaces](https://docs.corticallabs.com/cl/sim)

## CI responsibilities

- Python: run unit tests on Windows, macOS, and Ubuntu.
- TypeScript: run lint/type-check and production build on a supported Node/Bun environment.
- Optional SDK tests: separate job, skip when the SDK is not installed, and never require physical hardware for ordinary pull requests.
- Device integration tests: manual/authorized workflow, clearly labeled and not a substitute for simulator tests.

## Known implementation gaps

- The repository's SQL schema is present, but a production MySQL connector/repository adapter remains to be completed.
- The TypeScript cluster client needs stronger timeout/retry handling and complete server error contracts.
- Official CL SDK adapter is not yet implemented or verified.
- Build/test commands above are recommendations until actual CI output confirms success.
