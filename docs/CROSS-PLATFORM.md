# Cross-platform Support

## Targets

The Python research package is designed for Windows 10/11, modern macOS, and mainstream Linux distributions with Python 3.11 or newer. Automated CI targets Windows, macOS, and Ubuntu with Python 3.11, 3.12, and 3.13.

## Install from repository

From the repository root:

```powershell
# Windows PowerShell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e "./python[dev,server]"
python -m unittest discover -s python/tests -v
python -m cl1_neural_lab.cli --steps 10 --seed 1
```

```bash
# macOS / Linux
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -e "./python[dev,server]"
python -m unittest discover -s python/tests -v
python -m cl1_neural_lab.cli --steps 10 --seed 1
```

## Run the optional simulator REST server

After installing the `server` extra:

```bash
python -m cl1_neural_lab.server
```

The simulator server listens on port 3000 by default. Set `PORT` only after a corresponding configuration enhancement; the first implementation intentionally keeps the port consistent with the TypeScript prototype.

## Platform rules

- Use `pathlib.Path` for filesystem paths.
- Do not depend on shell-specific commands such as `rm -rf`.
- Do not require GPU drivers, native extensions, or a MySQL server for the core simulator.
- Treat MySQL, scientific Python packages, and the HTTP server as optional dependencies.
- Use UTF-8 for CSV and JSON.
- Keep secrets in environment variables or ignored local configuration files.

## Scope note

The Python simulator mirrors the behavior and assumptions of the current TypeScript model; it is not a bit-for-bit numerical reproduction and does not provide physical CL1 control. CI success is the evidence for supported operating-system/runtime combinations; do not claim the matrix passed until the workflow actually runs.