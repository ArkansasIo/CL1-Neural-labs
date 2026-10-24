"""CL1 Neural Labs — Python backend server.

A thin gateway that fronts the Rust simulation core (`cl1-server.exe`).
It proxies REST endpoints and streams WebSocket frames to clients,
including the Python client frontend in this package.

Endpoints (mirrors the Rust/TS contract):
    GET  /api/health        -> {"status": "ok"}
    GET  /api/status        -> live StatusReport JSON
    POST /api/stim          -> {"channels": [...], "amplitude_uv": ..., "duration_ms": ...}
    GET  /api/config        -> current CultureConfig
    POST /api/config        -> update CultureConfig
    POST /api/start         -> begin streaming
    POST /api/stop          -> stop streaming

Run:
    python -m cl1_py_backend.server          (gateway only)
    python -m cl1_py_backend.server --demo   (embedded simulator, no Rust exe needed)
"""
from __future__ import annotations

import argparse
import json
import os
import random
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DEFAULT_RUST_URL = os.environ.get("CL1_RUST_URL", "http://127.0.0.1:8100")
DEFAULT_PORT = int(os.environ.get("CL1_PY_PORT", "8200"))

CHANNELS = 64


# ---------------------------------------------------------------------------
# Embedded fallback simulator (used with --demo or when Rust core is absent)
# ---------------------------------------------------------------------------
class EmbeddedSimulator:
    """Minimal pure-Python stand-in for the Rust engine (simulation only)."""

    def __init__(self) -> None:
        self.tick = 0
        self.total_spikes = 0
        self.total_stims = 0
        self.running = False
        self.config = {
            "excitability": 1.0,
            "synaptic_density": 0.12,
            "target_rate_hz": 4.0,
            "seed": 42,
        }
        self.pending_stims: list[dict] = []
        self.rates = [0.0] * CHANNELS

    def step(self) -> dict:
        self.tick += 1
        spikes = []
        boost = [0.0] * CHANNELS
        for stim in self.pending_stims:
            self.total_stims += 1
            for ch in stim["channels"]:
                boost[ch] += stim["amplitude_uv"] / 100.0
        self.pending_stims.clear()

        for i in range(CHANNELS):
            lam = (self.config["target_rate_hz"] * self.config["excitability"] * (1 + boost[i])) / 1000.0
            if random.random() < lam:
                self.total_spikes += 1
                self.rates[i] = self.rates[i] * 0.99 + 0.01 * 1000
                spikes.append({"tick": self.tick, "channel": i, "amplitude_uv": random.uniform(60, 140)})
            else:
                self.rates[i] *= 0.995

        return {
            "tick": self.tick,
            "running": self.running,
            "total_spikes": self.total_spikes,
            "total_stims": self.total_stims,
            "burst_active": len(spikes) >= 8,
            "mean_rate_hz": round(sum(self.rates) / CHANNELS, 3),
            "channels": [
                {"channel": i, "rate_hz": round(self.rates[i], 3), "sample_uv": round(random.uniform(-3, 3), 3)}
                for i in range(CHANNELS)
            ],
            "spikes": spikes,
            "stims": [],
        }


# ---------------------------------------------------------------------------
# Gateway to the Rust core
# ---------------------------------------------------------------------------
class RustGateway:
    """Forwards requests to the Rust `cl1-server` REST API."""

    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")

    def _call(self, method: str, path: str, payload: dict | None = None) -> tuple[int, dict]:
        import urllib.request

        url = f"{self.base_url}{path}"
        data = json.dumps(payload).encode() if payload is not None else None
        req = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read().decode() or "{}")
        except Exception as exc:  # noqa: BLE001
            return 502, {"error": f"Rust core unreachable: {exc}"}

    def status(self) -> tuple[int, dict]:
        return self._call("GET", "/api/status")

    def stim(self, payload: dict) -> tuple[int, dict]:
        return self._call("POST", "/api/stim", payload)

    def config(self, payload: dict | None = None) -> tuple[int, dict]:
        if payload is None:
            return self._call("GET", "/api/config")
        return self._call("POST", "/api/config", payload)


# ---------------------------------------------------------------------------
# HTTP server
# ---------------------------------------------------------------------------
class Cl1Handler(BaseHTTPRequestHandler):
    sim: EmbeddedSimulator = None  # type: ignore[assignment]
    gateway: "RustGateway | None" = None
    demo: bool = False

    def log_message(self, fmt: str, *args) -> None:  # quieter logs
        pass

    @classmethod
    def _sim(cls) -> EmbeddedSimulator:
        if cls.sim is None:
            cls.sim = EmbeddedSimulator()
        return cls.sim

    def _send(self, code: int, body: dict) -> None:
        raw = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(raw)

    def _forward_or_local(self, method: str, path: str, payload: dict | None) -> tuple[int, dict]:
        """Forward to Rust core when available; else serve demo/local data."""
        if self.gateway is not None and not self.demo:
            if method == "GET":
                return self.gateway._call("GET", path)
            return self.gateway._call(method, path, payload or {})
        # Local fallback for diagnostics endpoints.
        if path == "/api/diagnostics/step":
            return 200, self._diag_step()
        if path.startswith("/api/diagnostics/scan/"):
            return 200, self._diag_scan(path.rsplit("/", 1)[-1])
        if path == "/api/diagnostics/pathology":
            return 200, self._diag_pathology(payload or {})
        return 404, {"error": "not found"}

    # --- embedded diagnostics simulator (demo fallback) ---
    _diag_state: dict = {}

    @classmethod
    def _diag_step(cls) -> dict:
        import random

        st = cls._diag_state
        st.setdefault("tick", 0)
        st["tick"] += 1
        findings = []
        if random.random() < 0.05:
            findings.append({
                "modality": "eeg",
                "finding": "epileptiform spike (simulated)",
                "confidence": 0.6,
                "severity": "mild",
                "note": f"channel {random.randint(0, CHANNELS - 1)}",
            })
        bpm = round(random.uniform(58, 95), 1)
        findings.append({
            "modality": "ecg",
            "finding": "rhythm: sinus" if 55 < bpm < 100 else "rhythm: abnormal (simulated)",
            "confidence": 0.7,
            "severity": "normal" if 55 < bpm < 100 else "mild",
            "note": f"bpm {bpm}",
        })
        return {"tick": st["tick"], "findings": findings,
                "disclaimer": "Synthetic simulation. Not medical data; not for diagnosis."}

    @classmethod
    def _diag_scan(cls, modality: str) -> dict:
        import random

        regions = ["frontal", "parietal", "temporal", "occipital", "cerebellum", "brainstem"]
        findings = []
        for r in regions:
            if random.random() < 0.1:
                findings.append({
                    "modality": modality,
                    "region": r,
                    "lesion_volume_mm3": round(random.uniform(60, 250), 1),
                    "anomaly": f"synthetic {modality} anomaly",
                    "severity": random.choice(["mild", "moderate"]),
                })
        return {"modality": modality, "findings": findings,
                "disclaimer": "Synthetic imaging simulation. Not medical data."}

    @classmethod
    def _diag_pathology(cls, payload: dict) -> dict:
        cls._diag_state.setdefault("pathology", []).append(payload)
        return {"injected": True, "region": payload.get("region"), "kind": payload.get("kind"),
                "disclaimer": "Synthetic pathology injected into the simulated brain model."}

    # --- built-in experiment list (demo fallback) ---
    _EXPERIMENTS = [
        ("pong", "DishBrain-style Pong: paddle tracks the hemisphere with higher firing"),
        ("associative-conditioning", "Pair ch0+ch1 stimulation, then test whether ch2 responds"),
        ("maze-navigation", "Navigate a synthetic maze using population activity"),
        ("burst-characterization", "Detect and measure synthetic network bursts"),
        ("evoked-potential", "Stimulate ch0 and measure the evoked response on ch1"),
        ("habituation", "Repeated identical stimulation; measure response decline"),
        ("sensitization", "Strong stimulus then test global response increase"),
        ("oscillation-cycling", "Drive slow oscillation cycles"),
        ("noise-rejection", "Stimulate during high noise epochs"),
        ("connectivity-mapping", "Estimate synthetic functional connectivity"),
        ("homeostasis", "Closed-loop regulation of mean firing rate"),
        ("plasticity-pairing", "STDP-like pre/post pairing protocol"),
        ("working-memory", "Delayed match-to-sample"),
        ("attention-wta", "Winner-take-all attention between two populations"),
        ("bandit-decision", "Two-armed bandit decision"),
        ("afterdischarge-screen", "Pulse train + afterdischarge-like runaway check"),
        ("interval-timing", "Fixed inter-stimulus interval tracking"),
        ("contrast-adaptation", "Alternate high/low contrast stimulation"),
        ("pattern-completion", "Cue half a pattern, check completion"),
        ("reafference", "Self-generated vs external activity cancellation"),
        ("go-no-go", "Respond to go cues, withhold on no-go"),
        ("place-field", "Synthetic spatial tuning"),
        ("replay-detection", "Sequential reactivation after training"),
        ("adaptive-dose", "Closed-loop dose titration"),
    ]

    @classmethod
    def _builtin_experiment_list(cls) -> list[dict]:
        return [{"name": n, "description": d} for n, d in cls._EXPERIMENTS]

    def do_GET(self) -> None:  # noqa: N802
        if self.path.startswith("/api") or self.path.startswith("/_"):
            self._do_api()
        else:
            if not self._serve_static():
                self._send(404, {"error": "not found"})

    def _do_api(self) -> None:
        if self.path == "/api/health":
            self._send(200, {"status": "ok", "demo": self.demo, "rust": self.gateway is not None})
        elif self.path == "/api/experiments":
            if self.demo or self.gateway is None:
                self._send(200, {"experiments": self._builtin_experiment_list(), "demo": True})
            else:
                code, body = self.gateway._call("GET", "/api/experiments")
                self._send(code, body)
        elif self.path == "/api/status":
            if self.demo or self.gateway is None:
                self._send(200, self._sim().step())
            else:
                code, body = self.gateway.status()
                self._send(code, body if code == 200 else body)
        elif self.path == "/api/config":
            if self.demo or self.gateway is None:
                self._send(200, self._sim().config)
            else:
                code, body = self.gateway.config()
                self._send(code, body)
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers.get("Content-Length", "0") or 0)
        payload = {}
        if length:
            try:
                payload = json.loads(self.rfile.read(length).decode() or "{}")
            except json.JSONDecodeError:
                self._send(400, {"error": "invalid JSON"})
                return

        if self.path == "/api/experiments/run":
            if self.demo or self.gateway is None:
                self._send(501, {"error": "experiment execution requires the Rust core (not in demo mode)"})
            else:
                code, body = self.gateway._call("POST", "/api/experiments/run", payload)
                self._send(code, body)
        elif self.path == "/api/brainscript":
            from .brainscript import run_script, BrainScriptError

            src = payload.get("script", "")
            if not src.strip():
                self._send(400, {"error": "missing 'script' field"})
                return
            try:
                result = run_script(src)
                self._send(200, {"ok": True, "result": result, "language": "brainscript"})
            except BrainScriptError as exc:
                self._send(400, {"ok": False, "error": str(exc), "language": "brainscript"})
        elif self.path == "/api/diagnostics/step":
            if self.demo or self.gateway is None:
                self._send(200, self._diag_step())
            else:
                code, body = self.gateway._call("POST", "/api/diagnostics/step", {})
                self._send(code, body)
        elif self.path == "/api/diagnostics/pathology":
            if self.demo or self.gateway is None:
                self._send(200, self._diag_pathology(payload))
            else:
                code, body = self.gateway._call("POST", "/api/diagnostics/pathology", payload)
                self._send(code, body)
        elif self.path == "/api/stim":
            channels = payload.get("channels") or []
            if not channels or any(not (0 <= c < CHANNELS) for c in channels):
                self._send(400, {"error": f"channels must be non-empty ints in 0..{CHANNELS - 1}"})
                return
            stim = {
                "channels": channels,
                "amplitude_uv": float(payload.get("amplitude_uv", 200.0)),
                "duration_ms": float(payload.get("duration_ms", 0.4)),
            }
            if self.demo or self.gateway is None:
                self._sim().pending_stims.append(stim)
                self._send(200, {"accepted": True, "demo": True})
            else:
                code, body = self.gateway.stim(stim)
                self._send(code, body)
        elif self.path == "/api/config":
            if self.demo or self.gateway is None:
                self._sim().config.update(payload)
                self._send(200, self._sim().config)
            else:
                code, body = self.gateway.config(payload)
                self._send(code, body)
        elif self.path == "/api/start":
            self.sim.running = True
            self._send(200, {"running": True})
        elif self.path == "/api/stop":
            self.sim.running = False
            self._send(200, {"running": False})
        else:
            self._send(404, {"error": "not found"})

    # ------------------------------------------------------------------
    # Static UI (built React app in ../dist or ./dist next to the exe)
    # ------------------------------------------------------------------

    _STATIC_ROOTS = None  # computed lazily

    @classmethod
    def _static_root(cls):
        if cls._STATIC_ROOTS is None:
            import sys
            candidates = []
            # PyInstaller onefile: _MEIPASS holds bundled data
            meipass = getattr(sys, "_MEIPASS", None)
            if meipass:
                candidates.append(os.path.join(meipass, "ui"))
            # running from source: repo root/dist
            here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # python_backend/
            repo = os.path.dirname(here)
            candidates.append(os.path.join(repo, "dist"))
            candidates.append(os.path.join(os.getcwd(), "dist"))
            cls._STATIC_ROOTS = [c for c in candidates if os.path.isdir(c)]
        return cls._STATIC_ROOTS[0] if cls._STATIC_ROOTS else None

    _MIME = {
        ".html": "text/html; charset=utf-8",
        ".js": "application/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".json": "application/json",
        ".ico": "image/x-icon",
        ".woff2": "font/woff2",
        ".map": "application/json",
    }

    def _serve_static(self) -> bool:
        root = self._static_root()
        if root is None:
            return False
        path = self.path.split("?", 1)[0]
        if path.startswith("/api") or path.startswith("/_"):
            return False
        if path == "/":
            path = "/index.html"
        # reject path traversal
        target = os.path.normpath(os.path.join(root, path.lstrip("/")))
        if not target.startswith(os.path.normpath(root)):
            return False
        if not os.path.isfile(target):
            # SPA fallback: serve index.html for client-side routes
            index = os.path.join(root, "index.html")
            if os.path.isfile(index):
                self._serve_file(index)
                return True
            return False
        self._serve_file(target)
        return True

    def _serve_file(self, filepath: str) -> None:
        ext = os.path.splitext(filepath)[1].lower()
        ctype = self._MIME.get(ext, "application/octet-stream")
        try:
            with open(filepath, "rb") as f:
                data = f.read()
        except OSError:
            self._send(404, {"error": "file not found"})
            return
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)


def main() -> None:
    parser = argparse.ArgumentParser(description="CL1 Python backend gateway")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--rust-url", default=DEFAULT_RUST_URL)
    parser.add_argument("--demo", action="store_true", help="run with embedded Python simulator")
    args = parser.parse_args()

    Cl1Handler.demo = args.demo
    if not args.demo:
        Cl1Handler.gateway = RustGateway(args.rust_url)
        code, _ = RustGateway(args.rust_url).status()
        if code == 502:
            print("[cl1-py-backend] Rust core not reachable; falling back to embedded simulator.")
            Cl1Handler.demo = True
            Cl1Handler.gateway = None

    server = ThreadingHTTPServer(("0.0.0.0", args.port), Cl1Handler)
    print(f"[cl1-py-backend] listening on http://0.0.0.0:{args.port} (demo={Cl1Handler.demo})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()
