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

use cl1_rust_backend::{
    CultureConfig, NeuralCultureEngine, StatusReport, StimEvent, CHANNELS,
};

#[derive(Clone)]
struct AppState {
    engine: Arc<Mutex<NeuralCultureEngine>>,
    status_rx: Arc<tokio::sync::RwLock<broadcast::Receiver<StatusReport>>>,
}

impl AppState {
    fn new() -> Self {
        let (engine, rx) = NeuralCultureEngine::new(CultureConfig::default());
        Self {
            engine: Arc::new(Mutex::new(engine)),
            status_rx: Arc::new(tokio::sync::RwLock::new(rx)),
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
