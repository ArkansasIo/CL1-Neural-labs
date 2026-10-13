# Python SDK Adapter Boundary

This directory documents the planned official CL SDK adapter. It intentionally does not import `cl` at module import time, so ordinary development and CI work without a CL1 device or SDK installation.

## Supported official interfaces to wrap

- `cl.open()` context manager
- `neurons.record()` and recording stop/wait lifecycle
- `neurons.timestamp()`
- `neurons.create_data_stream()`
- `cl.RecordingView` for reading recorded HDF5 data
- `cl.is_simulator()` for reporting runtime source

Exact method signatures and device safety constraints must be checked against the currently installed official SDK version before use. Keep all physical stimulation operations out of the first read-only adapter.

## Installation for optional integration testing

```bash
python -m pip install cl-sdk
```

Do not add the vendor SDK as a mandatory dependency for the simulator-only package. Use a separate integration environment and authorized hardware for device tests.
