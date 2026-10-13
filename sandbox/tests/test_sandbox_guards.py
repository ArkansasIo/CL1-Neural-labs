"""Pure unit tests for sandbox configuration guards; no CL SDK/device required."""
import os
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "run_sdk_sandbox.py"

def test_physical_flag_causes_refusal():
    env = os.environ.copy()
    env["CL1_REAL_DEVICE"] = "1"
    p = subprocess.run([sys.executable, str(SCRIPT), "--seconds", "1"],
                       env=env, capture_output=True, text=True)
    assert p.returncode != 0
    assert "Refusing to run" in p.stderr

def test_invalid_duration_is_rejected():
    env = os.environ.copy()
    env.pop("CL1_REAL_DEVICE", None)
    p = subprocess.run([sys.executable, str(SCRIPT), "--seconds", "0"],
                       env=env, capture_output=True, text=True)
    assert p.returncode != 0
    assert "--seconds must be" in p.stderr
