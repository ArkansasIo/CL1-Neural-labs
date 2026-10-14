# CL1 Neural Labs — Python Package

The Python package provides software-only simulation, research provenance, virtual hardware/cluster models, teaching tools, and optional HTTP server scaffolding. It does not implement a physical CL1 device driver.

## Requirements

- Python 3.11 or newer
- No required third-party runtime dependencies for the core simulator
- Optional packages:
  - `server`: `aiohttp` for the virtual cluster server
  - `science`: NumPy, SciPy, and pandas for downstream analysis workflows
  - `dev`: pytest, pytest-cov, and Ruff

## Install

From the repository root:

```bash
python -m pip install -e "./python[dev]"
```

Install the optional virtual cluster HTTP server:

```bash
python -m pip install -e "./python[server]"
```

## Run the simulator

```bash
python -m cl1_neural_lab.cli --steps 10 --step-ms 20 --seed 7
python -m cl1_neural_lab.cli --steps 10 --seed 7 --show-tables
```

The CLI prints JSON with the seed, step count, sample timestamp, synthetic spike count, and demonstration analytics. The analytics are illustrative software metrics and are not validated biological measurements.

## Run tests

```bash
python -m pytest python/tests -q
python -m pytest sandbox/tests -q
```

If running from inside the `python/` directory, use `python -m pytest tests -q` for the package tests.

## Start the virtual cluster server

After installing the `server` extra:

```bash
python -m cl1_neural_lab.server
```

The server listens on port 3001 by default and exposes the virtual cluster status, connect/pause/resume controls, and in-memory table inspection. It only manipulates virtual nodes.

## Module map

| Module | Responsibility |
|---|---|
| `neural_culture.py` | Deterministic 64-channel software simulator |
| `analysis_engine.py` | Synthetic co-activity matrix and demonstration metrics |
| `database_store.py` | In-memory SQLite store for tests and demos |
| `virtual_hardware.py` | Safe-by-default virtual device model |
| `cluster.py` | Multi-instance virtual cluster |
| `cluster_server.py` / `server.py` | Optional HTTP server and console entry point |
| `research_provenance.py` | Source labels and provenance metadata |
| `biological_recording.py` | Read-only recording inspection when the official SDK is installed |
| `education.py` / `maze.py` | Teaching exercises and pathfinding |
| `neurocognitive.py` | Symbolic reasoning demonstration with computational analogies |
| `auth.py` | In-memory authentication and authorization primitives |
| `plugins.py` | Explicit plugin registry and lifecycle interfaces |

## Data integrity and hardware boundary

- The simulator is not a living neural culture and is not scientifically validated as a biological equivalent.
- Imported files must be treated as unverified until provenance is confirmed independently.
- The virtual hardware model rejects physical modes; physical CL1 operation requires a separately validated official adapter, authorization, and independent hardware safety controls.
- Do not expose the development server to an untrusted network without adding deployment-grade authentication, TLS, rate limits, audit logging, and configuration hardening.
