# Real CL1 Hardware Integration

## Supported path

The official Cortical Labs Developer Guide describes the Python CL API, `cl.open()`, recording with `neurons.record()`, HDF5 `RecordingView`, data streams, and stimulation using `ChannelSet` and `StimDesign`. The vendor SDK is preinstalled on CL1 systems and offers the `cl-sdk` simulator for local development. Read the current official documentation before deploying because API versions and operating limits can change:

- [Cortical Labs Developer Guide](https://docs.corticallabs.com/)
- [CL API reference](https://docs.corticallabs.com/cl)
- [CL SDK simulator](https://docs.corticallabs.com/cl/sim)

## Added code

- `sdk/python/cl1_real_adapter.py`: optional adapter around official `cl` API.
- `scripts/cl1_real_record.py`: bounded recording-only entry point.
- `scripts/cl1_sdk_simulator_smoke.py`: SDK simulator smoke test.
- `scripts/cl1_stimulation_template.py`: intentionally non-executable template for a reviewed stimulation protocol.

## Enable real-device access

Run these only on a device/environment you are authorized to use. Start with simulator testing and read-only recording.

PowerShell:
```powershell
$env:CL1_REAL_DEVICE = "1"
python scripts/cl1_real_record.py --seconds 3
```

macOS/Linux:
```bash
export CL1_REAL_DEVICE=1
python scripts/cl1_real_record.py --seconds 3
```

The adapter checks this environment flag before importing the official SDK. Do not set it on ordinary development machines. The SDK may connect to its simulator if the environment is configured that way; the result explicitly labels the source based on `cl.is_simulator()`.

## Stimulation boundary

Stimulation is intentionally disabled unless the adapter is constructed with `allow_stimulation=True` and `CL1_ALLOW_STIM=1`; each request also requires explicit operator confirmation and an approved protocol ID. The adapter does not choose channels or pulse settings. Check all current vendor constraints, device profile, biological protocol, and local approvals before implementing or running any stimulation experiment. Software checks do not replace independent lab safety procedures.

## Verification status

These files are source additions, not proof of device validation. This environment has not connected to a physical CL1, installed the vendor SDK, run the SDK simulator, or verified behavior on a particular hardware/firmware revision. Validate the simulator smoke test first, then test read-only recording on an authorized system.
