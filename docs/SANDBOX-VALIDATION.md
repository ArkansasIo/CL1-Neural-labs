STATUS: implemented
SOURCE: ../sandbox/run_sdk_sandbox.py; ../sandbox/tests/test_sandbox_guards.py
API: ../sdk/python/cl1_real_adapter.py
TESTS: ../sandbox/tests/test_sandbox_guards.py
BACK: ./DOCUMENTATION-MANIFEST.md
NEXT: ./REAL-CL1-INTEGRATION.md

# Sandbox Validation and Promotion Checklist

## Stage 1 — repository-only tests
- Run Python unit tests, including `sandbox/tests/test_sandbox_guards.py`.
- Run TypeScript lint and production build.
- Verify no credentials or private HDF5 data are committed.

## Stage 2 — official SDK simulator
- Install the vendor-supported `cl-sdk` package in a disposable virtual environment.
- Run `python sandbox/run_sdk_sandbox.py --seconds 1`.
- Confirm the JSON report says `source=official_cl_sdk_simulator`, `is_simulator=true`, and `stimulation_requested=false`.
- If replaying a file, confirm its provenance and permissions; never treat replay as live biological data.

## Stage 3 — authorized physical device, read-only
- Use the current official CL documentation and device-specific lab procedure.
- Run the recording-only script on an authorized CL1 environment.
- Confirm system identity, source provenance, output location, recording completeness, and timestamps.
- Do not run the sandbox runner with physical-device access enabled.

## Stage 4 — physical stimulation
Not part of sandbox validation. Requires a separately reviewed protocol, current vendor limits, verified device/channel metadata, explicit operator authorization, institutional approvals where applicable, and independent safety procedures. The repository's software gates are not a physical safety circuit.

## Current verification state
The sandbox scripts and tests are committed source files. Unless a CI run or command output is linked here, no test result should be assumed. Physical CL1 access has not been performed by this repository authoring session.
