# CL1 Python Backend & Client

- `cl1_py_backend/server.py` — gateway server (std-lib only, no dependencies) that fronts the Rust `cl1-server.exe` core, with an embedded pure-Python fallback simulator (`--demo`).
- `cl1_py_backend/client.py` — terminal frontend rendering a live 8×8 MEA activity grid.

## Usage

```powershell
# 1. Start the Rust core (optional; the Python server falls back to its embedded simulator)
.\rust_backend\target\release\cl1-server.exe

# 2. Start the Python backend
python -m cl1_py_backend.server            # proxies http://127.0.0.1:8100 (Rust)
python -m cl1_py_backend.server --demo     # embedded Python simulator only

# 3. Run the client frontend (new terminal)
python -m cl1_py_backend.client
```

Environment variables: `CL1_RUST_URL` (default `http://127.0.0.1:8100`), `CL1_PY_PORT` (8200), `CL1_PY_URL` (client target).

> All activity is synthetic simulation. Nothing here controls physical CL1 hardware.
