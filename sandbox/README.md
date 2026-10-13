# CL1 Sandbox

This is the default safe environment for developing and testing CL1-Neural-labs without controlling physical hardware.

## Modes

1. **Project simulator** — existing in-repository neural culture model.
2. **Official CL SDK simulator** — the vendor SDK API running against generated data or an HDF5 replay.
3. **Recording replay** — official SDK simulator reads a user-supplied HDF5 recording.
4. **Physical CL1** — separate, explicitly enabled workflow; never started by the sandbox scripts.

The official SDK simulator has API parity with the on-device API, but its default synthetic data does not represent biological learning and should be used for integration controls, not as experimental evidence. See the official [CL SDK Simulator documentation](https://docs.corticallabs.com/cl/sim).

## Setup

```bash
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install cl-sdk
```

Run the sandbox smoke test:

```bash
python sandbox/run_sdk_sandbox.py --seconds 1
```

This script refuses to run if `CL1_REAL_DEVICE=1` is set. It also forces simulator intent through the SDK's documented environment settings and checks `cl.is_simulator()` after opening the SDK session. If the SDK reports a physical device, the script stops instead of continuing.

## HDF5 replay

```bash
# Set to a valid local recording path before running:
# Windows PowerShell
$env:CL_SDK_REPLAY_PATH = "C:\\data\\recording.h5"
# macOS/Linux
export CL_SDK_REPLAY_PATH=/data/recording.h5
python sandbox/run_sdk_sandbox.py --seconds 2
```

The replay path must point to a recording you are authorized to use. Recordings can contain sensitive research data; keep them outside Git and configure access appropriately.

## Outputs and provenance

The script writes a JSON report under `sandbox/output/` containing source, elapsed time, and recording metadata. It does not run stimulation. Output is generated locally and should not be committed if it contains private dataset details.

## Sandbox boundaries

- Does not call `neurons.stim()`.
- Does not set `CL1_REAL_DEVICE`.
- Does not automatically discover or connect to physical devices.
- Does not prove biological learning, cognition, or consciousness.
- Does not replace device-specific lab procedures.
