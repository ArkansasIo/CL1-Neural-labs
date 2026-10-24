//! CL1-style CL1 Neural Labs server: REST + WebSocket over the Rust engine.
//!
//! Endpoints mirror the TypeScript `server.ts` contract:
//!   GET  /_/config          — build/configuration info
//!   GET  /api/status        — current simulation status snapshot
//!   POST /api/stim          — submit a stimulation pulse
//!   POST /api/config        — update culture parameters
//!   POST /api/start | /api/stop
//!   WS   /_/ws/overview     — live per-tick status stream

use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use serde_json::json;
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use tower_http::cors::CorsLayer;

use cl1_rust_backend::hardware::cl1_api_adapter::{Cl1ApiAdapter, Cl1ConnectionConfig};
use cl1_rust_backend::hardware::plugin::{
    BurstMonitorPlugin, ClosedLoopDriverPlugin, PluginActions, PluginRegistry, RecorderPlugin,
};
use cl1_rust_backend::hardware::safety::{SafetyGate, SafetyPolicy};
use cl1_rust_backend::hardware::{AdapterMode, HardwareAdapter};
use cl1_rust_backend::{
    diagnostics::{DiagnosticEngine, PathologyKind},
    CultureConfig, NeuralCultureEngine, StatusReport, StimEvent, CHANNELS,
};

/// Server-wide hardware/plugin runtime shared across handlers.
struct Runtime {
    adapter: Option<Cl1ApiAdapter>,
    plugins: PluginRegistry,
    gate: SafetyGate,
    hardware_mode: bool,
    diagnostics: DiagnosticEngine,
}

#[derive(Clone)]
struct AppState {
    engine: Arc<Mutex<NeuralCultureEngine>>,
    status_rx: Arc<tokio::sync::RwLock<broadcast::Receiver<StatusReport>>>,
    runtime: Arc<Mutex<Runtime>>,
}

impl AppState {
    fn new() -> Self {
        let (engine, rx) = NeuralCultureEngine::new(CultureConfig::default());
        let mut plugins = PluginRegistry::new();
        plugins.register(Box::new(BurstMonitorPlugin::new()));
        plugins.register(Box::new(RecorderPlugin::new(10_000)));
        let gate = SafetyGate::new(SafetyPolicy::default()).expect("default policy is valid");
        Self {
            engine: Arc::new(Mutex::new(engine)),
            status_rx: Arc::new(tokio::sync::RwLock::new(rx)),
            runtime: Arc::new(Mutex::new(Runtime {
                adapter: None,
                plugins,
                gate,
                hardware_mode: false,
                diagnostics: DiagnosticEngine::new(CHANNELS),
            })),
        }
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let port: u16 = std::env::var("CL1_RUST_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8100);

    let state = AppState::new();

    // Spawn the engine loop.
    {
        let engine = state.engine.clone();
        tokio::spawn(async move {
            loop {
                {
                    let mut e = engine.lock().unwrap();
                    e.step();
                }
                tokio::time::sleep(std::time::Duration::from_millis(40)).await;
            }
        });
    }

    let app = Router::new()
        .route("/_/config", get(get_config))
        .route("/api/status", get(get_status))
        .route("/api/stim", post(post_stim))
        .route("/api/config", post(post_config))
        .route("/api/start", post(post_start))
        .route("/api/stop", post(post_stop))
        .route("/api/hardware/info", get(get_hardware_info))
        .route("/api/hardware/connect", post(post_hw_connect))
        .route("/api/hardware/disconnect", post(post_hw_disconnect))
        .route("/api/hardware/poll", get(get_hw_poll))
        .route("/api/plugins", get(get_plugins))
        .route("/api/plugins/tick", post(post_plugins_tick))
        .route("/api/diagnostics/step", post(post_diagnostics_step))
        .route("/api/diagnostics/scan/{modality}", get(get_diagnostics_scan))
        .route("/api/diagnostics/pathology", post(post_diagnostics_pathology))
        .route("/api/experiments", get(get_experiments))
        .route("/api/experiments/run", post(post_experiment_run))
        .route("/api/brainscript", post(post_brainscript))
        .route("/_/ws/overview", get(ws_overview))
        .layer(CorsLayer::very_permissive())
        .with_state(state);

    let addr = format!("0.0.0.0:{port}");
    tracing::info!("CL1 Rust backend listening on http://{addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn get_config() -> Json<serde_json::Value> {
    Json(json!({
        "name": "cl1-neural-labs-rust-backend",
        "version": env!("CARGO_PKG_VERSION"),
        "channels": CHANNELS,
        "sample_rate_hz": cl1_rust_backend::SAMPLE_RATE_HZ,
        "waveform_len": cl1_rust_backend::WAVEFORM_LEN,
        "role": "simulation-core",
        "disclaimer": "Software simulation only. Not biological hardware control."
    }))
}

async fn get_status(State(state): State<AppState>) -> Json<StatusReport> {
    let report = {
        let engine = state.engine.lock().unwrap();
        // Peek a status without stepping: we rebuild from last broadcast.
        // Simpler: step is done by the loop; here we produce a snapshot.
        drop(engine);
        // We store latest report by re-subscribing? For simplicity, return last known via broadcast.
        // Instead we snapshot engine state through a step-free helper below.
        snapshot(&state).await
    };
    Json(report)
}

async fn snapshot(state: &AppState) -> StatusReport {
    // Subscribe and read the most recent broadcast without blocking long.
    let mut rx = state.status_rx.write().await;
    // Try a non-blocking receive; if empty, step once to get fresh data.
    match rx.try_recv() {
        Ok(rep) => rep,
        Err(_) => {
            let mut engine = state.engine.lock().unwrap();
            engine.step()
        }
    }
}

async fn post_stim(
    State(state): State<AppState>,
    Json(body): Json<StimRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    if body.channels.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "channels must not be empty"})),
        ));
    }
    for &ch in &body.channels {
        if ch >= CHANNELS {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({"error": format!("channel {ch} out of range 0..{}", CHANNELS - 1)})),
            ));
        }
    }
    let stim = StimEvent {
        channels: body.channels.clone(),
        amplitude_uv: body.amplitude_uv.unwrap_or(200.0),
        duration_ms: body.duration_ms.unwrap_or(0.4),
        tick: 0,
    };
    state.engine.lock().unwrap().apply_stim(stim);
    Ok(Json(json!({
        "accepted": true,
        "channels": body.channels,
        "note": "Stimulation queued for next simulation tick (software simulation only)."
    })))
}

#[derive(serde::Deserialize)]
struct StimRequest {
    channels: Vec<usize>,
    #[serde(default)]
    amplitude_uv: Option<f64>,
    #[serde(default)]
    duration_ms: Option<f64>,
}

async fn post_config(
    State(state): State<AppState>,
    Json(config): Json<CultureConfig>,
) -> Json<CultureConfig> {
    let mut engine = state.engine.lock().unwrap();
    engine.set_config(config.clone());
    Json(engine.config().clone())
}

async fn post_start(State(state): State<AppState>) -> Json<serde_json::Value> {
    state.engine.lock().unwrap().step(); // nudge
    Json(json!({"running": true}))
}

async fn post_stop(State(_state): State<AppState>) -> Json<serde_json::Value> {
    // The loop keeps stepping; stopping is a logical flag for clients.
    Json(json!({"running": false}))
}

// ------------------------------------------------------------------
// Hardware adapter + plugin endpoints
// ------------------------------------------------------------------

async fn get_hardware_info(State(state): State<AppState>) -> Json<serde_json::Value> {
    let rt = state.runtime.lock().unwrap();
    let adapter = rt.adapter.as_ref().map(|a| a.info());
    Json(json!({
        "hardware_mode": rt.hardware_mode,
        "adapter": adapter,
        "note": "Hardware mode requires a configured, authorized CL1 device endpoint; fails closed otherwise."
    }))
}

async fn post_hw_connect(State(state): State<AppState>) -> Json<serde_json::Value> {
    let connected;
    let info_value;
    {
        let mut rt = state.runtime.lock().unwrap();
        if rt.adapter.is_none() {
            rt.adapter = Some(
                Cl1ApiAdapter::new(Cl1ConnectionConfig::default(), SafetyPolicy::default())
                    .expect("default safety policy is valid"),
            );
        }
        let connect_result = rt.adapter.as_mut().unwrap().connect();
        match connect_result {
            Ok(()) => {
                rt.hardware_mode = true;
            }
            Err(e) => {
                return Json(json!({"connected": false, "error": e.to_string()}));
            }
        }
    }
    let rt = state.runtime.lock().unwrap();
    connected = true;
    info_value = rt.adapter.as_ref().map(|a| a.info());
    Json(json!({"connected": connected, "info": info_value}))
}

async fn post_hw_disconnect(State(state): State<AppState>) -> Json<serde_json::Value> {
    let mut rt = state.runtime.lock().unwrap();
    if let Some(adapter) = rt.adapter.as_mut() {
        let _ = adapter.disconnect();
    }
    rt.hardware_mode = false;
    Json(json!({"connected": false}))
}

async fn get_hw_poll(State(state): State<AppState>) -> Json<serde_json::Value> {
    let mut rt = state.runtime.lock().unwrap();
    if !rt.hardware_mode {
        return Json(json!({"hardware_mode": false, "note": "use simulation /api/status"}));
    }
    match rt.adapter.as_mut() {
        Some(a) => match a.snapshot() {
            Ok(rep) => Json(serde_json::to_value(rep).unwrap_or_default()),
            Err(e) => Json(json!({"error": e.to_string()})),
        },
        None => Json(json!({"hardware_mode": false, "error": "adapter missing"})),
    }
}

async fn get_plugins(State(state): State<AppState>) -> Json<serde_json::Value> {
    let rt = state.runtime.lock().unwrap();
    let plugins: Vec<_> = rt
        .plugins
        .names()
        .into_iter()
        .map(|(name, version)| json!({"name": name, "version": version}))
        .collect();
    Json(json!({"plugins": plugins}))
}

async fn post_plugins_tick(State(state): State<AppState>) -> Json<serde_json::Value> {
    let report = {
        let engine = state.engine.lock().unwrap();
        engine.last_report()
    };
    let mut rt = state.runtime.lock().unwrap();
    let actions: PluginActions = rt.plugins.step(&report);
    // Route plugin stimulation through the shared safety gate.
    let mut approved = 0usize;
    let mut rejected: Vec<String> = Vec::new();
    for stim in &actions.stim_requests {
        match rt
            .gate
            .check(&stim.channels, stim.amplitude_uv, stim.duration_ms)
        {
            cl1_rust_backend::hardware::safety::SafetyVerdict::Allowed => {
                state.engine.lock().unwrap().apply_stim(stim.clone());
                approved += 1;
            }
            cl1_rust_backend::hardware::safety::SafetyVerdict::Rejected(reason) => {
                rejected.push(reason);
            }
        }
    }
    Json(json!({
        "messages": actions.messages,
        "stims_approved": approved,
        "stims_rejected": rejected,
    }))
}

// ------------------------------------------------------------------
// Experiment suite endpoints
// ------------------------------------------------------------------

async fn get_experiments() -> Json<serde_json::Value> {
    let list: Vec<_> = cl1_rust_backend::experiments::builtin_experiments()
        .into_iter()
        .map(|(name, desc)| json!({"name": name, "description": desc}))
        .collect();
    Json(json!({"experiments": list, "count": list.len()}))
}

#[derive(serde::Deserialize)]
struct ExperimentRunRequest {
    name: String,
    #[serde(default = "default_ticks")]
    ticks: u64,
}
fn default_ticks() -> u64 {
    100
}

async fn post_experiment_run(
    State(state): State<AppState>,
    Json(body): Json<ExperimentRunRequest>,
) -> Json<serde_json::Value> {
    let Some(mut exp) = cl1_rust_backend::experiments::experiment_by_name(&body.name) else {
        return Json(json!({"error": format!("unknown experiment '{}' (see GET /api/experiments)", body.name)}));
    };
    let mut last_report = {
        let engine = state.engine.lock().unwrap();
        engine.last_report()
    };
    let mut stim_applied = 0u64;
    let mut stim_rejected = 0u64;
    let mut observations = 0u64;
    let mut summary = None;
    for tick in 0..body.ticks {
        // Advance the simulation one step per experiment tick.
        last_report = {
            let mut engine = state.engine.lock().unwrap();
            engine.step()
        };
        let step = exp.step(&last_report);
        observations += 1;
        // Route stim requests through the safety gate.
        let mut rt = state.runtime.lock().unwrap();
        for stim in &step.stim_requests {
            match rt.gate.check(&stim.channels, stim.amplitude_uv, stim.duration_ms) {
                cl1_rust_backend::hardware::safety::SafetyVerdict::Allowed => {
                    state.engine.lock().unwrap().apply_stim(stim.clone());
                    stim_applied += 1;
                }
                cl1_rust_backend::hardware::safety::SafetyVerdict::Rejected(_) => {
                    stim_rejected += 1;
                }
            }
        }
        summary = Some(serde_json::to_value(exp.summary()).unwrap_or_default());
        if step.done {
            break;
        }
        let _ = tick;
    }
    Json(json!({
        "experiment": body.name,
        "ticks_requested": body.ticks,
        "observations": observations,
        "stims_applied": stim_applied,
        "stims_rejected": stim_rejected,
        "summary": summary,
    }))
}

// ------------------------------------------------------------------
// BrainScript endpoint: scripts run in the Python gateway, so this Rust
// endpoint only acknowledges. The actual execution happens client/gateway
// side (POST to the Python server /api/brainscript).
// ------------------------------------------------------------------
async fn post_brainscript(Json(body): Json<serde_json::Value>) -> Json<serde_json::Value> {
    Json(json!({
        "note": "BrainScript executes in the Python gateway; POST /api/brainscript there.",
        "received": body,
    }))
}

async fn post_diagnostics_step(State(state): State<AppState>) -> Json<serde_json::Value> {
    let mut rt = state.runtime.lock().unwrap();
    let findings = {
        let mut rng = rand::thread_rng();
        rt.diagnostics.step(&mut rng)
    };
    Json(json!({
        "tick": rt.diagnostics.tick,
        "findings": findings,
        "disclaimer": "Synthetic simulation. Not medical data; not for diagnosis."
    }))
}

async fn get_diagnostics_scan(
    State(state): State<AppState>,
    axum::extract::Path(modality): axum::extract::Path<String>,
) -> Json<serde_json::Value> {
    const VALID: [&str; 6] = ["mri", "ct", "fmri", "mra", "pet", "spect"];
    if !VALID.contains(&modality.as_str()) {
        return Json(json!({
            "error": format!("unknown modality '{modality}'; valid: {VALID:?}"),
        }));
    }
    let mut rt = state.runtime.lock().unwrap();
    let findings = rt.diagnostics.scan_imaging(&modality);
    Json(json!({
        "modality": modality,
        "regions": rt.diagnostics.imaging.regions,
        "findings": findings,
        "disclaimer": "Synthetic imaging simulation over a region-based brain model. Not medical data."
    }))
}

#[derive(serde::Deserialize)]
struct PathologyRequest {
    region: String,
    kind: String, // lesion | bleeding | hypoperfusion | hypometabolism
    magnitude: f64,
}

async fn post_diagnostics_pathology(
    State(state): State<AppState>,
    Json(body): Json<PathologyRequest>,
) -> Json<serde_json::Value> {
    let kind = match body.kind.as_str() {
        "lesion" => PathologyKind::Lesion,
        "bleeding" => PathologyKind::Bleeding,
        "hypoperfusion" => PathologyKind::Hypoperfusion,
        "hypometabolism" => PathologyKind::Hypometabolism,
        other => {
            return Json(json!({"error": format!("unknown pathology kind '{other}'")}));
        }
    };
    let mut rt = state.runtime.lock().unwrap();
    rt.diagnostics.imaging.inject_pathology(&body.region, kind, body.magnitude);
    Json(json!({
        "injected": true,
        "region": body.region,
        "kind": body.kind,
        "disclaimer": "Synthetic pathology injected into the simulated brain model for research."
    }))
}

async fn ws_overview(State(state): State<AppState>, ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(socket, state))
}

async fn handle_ws(mut socket: WebSocket, state: AppState) {
    let mut rx = state.status_rx.write().await.resubscribe();
    loop {
        match rx.recv().await {
            Ok(report) => {
                let msg = serde_json::to_string(&report)
                    .map(|s| Message::Text(s.into()));
                match msg {
                    Ok(text) => {
                        if socket.send(text).await.is_err() {
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }
            Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
            Err(_) => break,
        }
    }
}
