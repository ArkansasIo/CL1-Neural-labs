//! Adapter for the official Cortical Labs CL1 API boundary.
//!
//! This adapter translates the common neural data model to/from the
//! device-side REST surface expected from a CL1 system:
//!
//!   GET  {base}/v1/status          -> device status JSON
//!   GET  {base}/v1/spikes?since=.. -> spike records since a timestamp
//!   POST {base}/v1/stimulation     -> submit a stimulation pulse
//!
//! ## Requirements before real use
//! - The official CL software/API must be installed, licensed and reachable.
//! - Connection details come from configuration/env, never hard-coded.
//! - An independent safety review must approve the `SafetyPolicy` used.
//! - Until a validated device endpoint is provided, `connect()` will report
//!   `NotConnected` and no stimulation can pass the gate. This is deliberate:
//!   the adapter fails closed by default.

use crate::hardware::{AdapterError, AdapterInfo, AdapterMode, HardwareAdapter};
use crate::hardware::safety::{SafetyGate, SafetyPolicy, SafetyVerdict};
use crate::types::{ChannelFrame, SpikeEvent, StatusReport, StimEvent};
use crate::{CHANNELS, SAMPLE_RATE_HZ};
use std::time::Instant;

/// Connection description for a CL1 device endpoint.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Cl1ConnectionConfig {
    /// Base URL of the device API, e.g. `http://192.168.1.50:8080`.
    pub base_url: String,
    /// Bearer token or API key, supplied via env/config; never logged.
    pub auth_token: Option<String>,
    /// Request timeout in seconds.
    pub timeout_s: u64,
}

impl Default for Cl1ConnectionConfig {
    fn default() -> Self {
        Self {
            base_url: std::env::var("CL1_DEVICE_URL").unwrap_or_default(),
            auth_token: std::env::var("CL1_DEVICE_TOKEN").ok(),
            timeout_s: 5,
        }
    }
}

impl Cl1ConnectionConfig {
    /// True when a plausible endpoint is configured.
    pub fn is_configured(&self) -> bool {
        !self.base_url.is_empty()
    }
}

/// Hardware adapter for the CL1 device API. Fails closed unless a real,
/// configured endpoint answers the status probe.
#[derive(Debug)]
pub struct Cl1ApiAdapter {
    config: Cl1ConnectionConfig,
    gate: SafetyGate,
    connected: bool,
    last_spike_ms: f64,
    tick: u64,
    total_spikes: u64,
    total_stims: u64,
    rates: Vec<f64>,
}

impl Cl1ApiAdapter {
    /// Create an adapter. The safety policy must pass validation.
    pub fn new(config: Cl1ConnectionConfig, policy: SafetyPolicy) -> Result<Self, AdapterError> {
        let gate = SafetyGate::new(policy).map_err(AdapterError::SafetyRejected)?;
        Ok(Self {
            config,
            gate,
            connected: false,
            last_spike_ms: 0.0,
            tick: 0,
            total_spikes: 0,
            total_stims: 0,
            rates: vec![0.0; CHANNELS],
        })
    }

    fn device_get(&self, path: &str) -> Result<String, AdapterError> {
        if !self.config.is_configured() {
            return Err(AdapterError::NotConnected);
        }
        let url = format!("{}{}", self.config.base_url.trim_end_matches('/'), path);
        let agent = build_agent(self.config.timeout_s);
        let mut req = agent.get(&url);
        if let Some(tok) = &self.config.auth_token {
            let auth = format!("Bearer {tok}");
            req = req.set("Authorization", &auth);
        }
        req.call()
            .map(|resp| resp.into_string().unwrap_or_default())
            .map_err(|e| AdapterError::Io(format!("device request failed: {e}")))
    }

    fn device_post_json(&self, path: &str, body: &str) -> Result<String, AdapterError> {
        if !self.config.is_configured() {
            return Err(AdapterError::NotConnected);
        }
        let url = format!("{}{}", self.config.base_url.trim_end_matches('/'), path);
        let agent = build_agent(self.config.timeout_s);
        let mut req = agent.post(&url).set("Content-Type", "application/json");
        if let Some(tok) = &self.config.auth_token {
            let auth = format!("Bearer {tok}");
            req = req.set("Authorization", &auth);
        }
        req.send_string(body)
            .map(|resp| resp.into_string().unwrap_or_default())
            .map_err(|e| AdapterError::Io(format!("device request failed: {e}")))
    }

    /// Parse the device spike record format:
    /// `{"spikes":[{"channel":N,"time_ms":F,"amplitude_uv":F}, ...]}`
    fn parse_device_spikes(&mut self, body: &str) -> Vec<SpikeEvent> {
        #[derive(serde::Deserialize)]
        struct DeviceSpike {
            channel: usize,
            time_ms: f64,
            #[serde(default = "default_amp")]
            amplitude_uv: f64,
        }
        #[derive(serde::Deserialize)]
        struct DeviceSpikeBatch {
            #[serde(default)]
            spikes: Vec<DeviceSpike>,
        }
        fn default_amp() -> f64 {
            80.0
        }

        let last = self.last_spike_ms;
        match serde_json::from_str::<DeviceSpikeBatch>(body) {
            Ok(batch) => batch
                .spikes
                .into_iter()
                .filter(|s| s.channel < CHANNELS && s.time_ms > last)
                .map(|s| {
                    self.last_spike_ms = self.last_spike_ms.max(s.time_ms);
                    SpikeEvent {
                        tick: self.tick,
                        channel: s.channel,
                        amplitude_uv: s.amplitude_uv,
                        timestamp_ms: s.time_ms,
                    }
                })
                .collect(),
            Err(_) => Vec::new(), // malformed device payload: fail closed, no synthetic data
        }
    }
}

impl HardwareAdapter for Cl1ApiAdapter {
    fn info(&self) -> AdapterInfo {
        AdapterInfo {
            id: "cl1-api".into(),
            name: "Cortical Labs CL1 API adapter".into(),
            mode: AdapterMode::Hardware,
            channels: CHANNELS,
            sample_rate_hz: SAMPLE_RATE_HZ,
            connected: self.connected,
            backend: format!("official CL device API at {}", self.config.base_url),
        }
    }

    fn connect(&mut self) -> Result<(), AdapterError> {
        if !self.config.is_configured() {
            tracing::warn!("CL1 adapter: no device URL configured; refusing to connect (fail closed)");
            return Err(AdapterError::NotConnected);
        }
        // Probe the device status endpoint before declaring the link up.
        match self.device_get("/v1/status") {
            Ok(body) => {
                self.connected = body.contains("\"ok\"") || body.contains("\"status\"");
                if self.connected {
                    tracing::info!("CL1 adapter: device link established");
                }
                Ok(())
            }
            Err(e) => {
                self.connected = false;
                Err(e)
            }
        }
    }

    fn disconnect(&mut self) -> Result<(), AdapterError> {
        self.connected = false;
        Ok(())
    }

    fn poll_spikes(&mut self) -> Result<Vec<SpikeEvent>, AdapterError> {
        if !self.connected {
            return Err(AdapterError::NotConnected);
        }
        let since = format!("{:.3}", self.last_spike_ms);
        let body = self.device_get(&format!("/v1/spikes?since={since}"))?;
        let spikes = self.parse_device_spikes(&body);
        self.total_spikes += spikes.len() as u64;
        for s in &spikes {
            if let Some(r) = self.rates.get_mut(s.channel) {
                *r = *r * 0.99 + 0.01 * 1000.0;
            }
        }
        Ok(spikes)
    }

    fn deliver_stim(&mut self, stim: &StimEvent) -> Result<(), AdapterError> {
        // 1. Safety gate first — always.
        if let SafetyVerdict::Rejected(reason) = self
            .gate
            .check(&stim.channels, stim.amplitude_uv, stim.duration_ms)
        {
            tracing::warn!("CL1 adapter: stimulation rejected by safety gate: {reason}");
            return Err(AdapterError::SafetyRejected(reason));
        }
        // 2. Device link must be up.
        if !self.connected {
            return Err(AdapterError::NotConnected);
        }
        // 3. Translate to device format and send.
        let payload = serde_json::json!({
            "channels": stim.channels,
            "amplitude_uv": stim.amplitude_uv,
            "duration_ms": stim.duration_ms,
        });
        self.device_post_json("/v1/stimulation", &payload.to_string())?;
        self.total_stims += 1;
        tracing::info!(
            "CL1 adapter: stimulation delivered to device (channels={:?}, amp={} uV)",
            stim.channels,
            stim.amplitude_uv
        );
        Ok(())
    }

    fn snapshot(&mut self) -> Result<StatusReport, AdapterError> {
        let spikes = if self.connected {
            self.poll_spikes().unwrap_or_default()
        } else {
            Vec::new()
        };
        self.tick += 1;
        let mean_rate = self.rates.iter().sum::<f64>() / CHANNELS as f64;
        Ok(StatusReport {
            tick: self.tick,
            running: self.connected,
            uptime_s: 0.0,
            total_spikes: self.total_spikes,
            total_stims: self.total_stims,
            burst_active: false,
            burst_progress: 0.0,
            mean_rate_hz: mean_rate,
            channels: (0..CHANNELS)
                .map(|i| ChannelFrame {
                    channel: i,
                    baseline_uv: 0.0,
                    sample_uv: 0.0,
                    rate_hz: self.rates[i],
                    refractory: false,
                    spiked: spikes.iter().any(|s| s.channel == i),
                })
                .collect(),
            spikes,
            stims: Vec::new(),
        })
    }
}

// --- Minimal HTTP helpers (kept dependency-light) -------------------------

fn build_agent(timeout_s: u64) -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout(std::time::Duration::from_secs(timeout_s))
        .build()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn adapter() -> Cl1ApiAdapter {
        Cl1ApiAdapter::new(
            Cl1ConnectionConfig {
                base_url: String::new(), // unconfigured on purpose
                auth_token: None,
                timeout_s: 1,
            },
            SafetyPolicy::default(),
        )
        .unwrap()
    }

    #[test]
    fn fails_closed_when_unconfigured() {
        let mut a = adapter();
        assert!(matches!(a.connect(), Err(AdapterError::NotConnected)));
        // Gate allows valid params, but the link is down → NotConnected (fail closed).
        assert!(matches!(
            a.deliver_stim(&StimEvent {
                channels: vec![0],
                amplitude_uv: 100.0,
                duration_ms: 1.0,
                tick: 0,
            }),
            Err(AdapterError::NotConnected)
        ));
    }

    #[test]
    fn parses_device_spikes() {
        let mut a = adapter();
        let spikes = a.parse_device_spikes(
            r#"{"spikes":[{"channel":3,"time_ms":12.5,"amplitude_uv":95.0}]}"#,
        );
        assert_eq!(spikes.len(), 1);
        assert_eq!(spikes[0].channel, 3);
        // Malformed payload yields no synthetic data.
        assert!(a.parse_device_spikes("not json").is_empty());
    }

    #[test]
    fn gate_blocks_excess_channels() {
        let mut a = adapter();
        let stim = StimEvent {
            channels: (0..20).collect(),
            amplitude_uv: 100.0,
            duration_ms: 1.0,
            tick: 0,
        };
        assert!(matches!(
            a.deliver_stim(&stim),
            Err(AdapterError::SafetyRejected(_))
        ));
    }
}
