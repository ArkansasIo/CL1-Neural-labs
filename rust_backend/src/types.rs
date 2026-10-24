//! Shared data types for the CL1 Neural Labs simulation core.

use serde::{Deserialize, Serialize};

/// Configuration of the simulated culture.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct CultureConfig {
    /// Global excitability multiplier (0.1 – 4.0).
    pub excitability: f64,
    /// Probability that any given synapse transmits on a pre-synaptic spike.
    pub synaptic_density: f64,
    /// Long-term target mean firing rate in Hz per channel.
    pub target_rate_hz: f64,
    /// Seed for the internal pseudo-random generator.
    pub seed: u64,
}

impl Default for CultureConfig {
    fn default() -> Self {
        Self {
            excitability: 1.0,
            synaptic_density: 0.12,
            target_rate_hz: 4.0,
            seed: 0xC1_042,
        }
    }
}

/// One spike on one channel.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpikeEvent {
    pub tick: u64,
    pub channel: usize,
    pub amplitude_uv: f64,
    pub timestamp_ms: f64,
}

/// A stimulation pulse applied to one or more channels.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StimEvent {
    pub channels: Vec<usize>,
    pub amplitude_uv: f64,
    pub duration_ms: f64,
    pub tick: u64,
}

/// A snapshot of a single channel at one tick.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelFrame {
    pub channel: usize,
    /// Current baseline voltage in microvolts.
    pub baseline_uv: f64,
    /// Latest waveform sample in microvolts.
    pub sample_uv: f64,
    /// Estimated firing rate in Hz (exponential moving average).
    pub rate_hz: f64,
    /// True while the channel is in its refractory period.
    pub refractory: bool,
    /// True if this channel spiked on the current tick.
    pub spiked: bool,
}

/// Full per-tick report used by the REST and WebSocket transports.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusReport {
    pub tick: u64,
    pub running: bool,
    pub uptime_s: f64,
    pub total_spikes: u64,
    pub total_stims: u64,
    pub burst_active: bool,
    pub burst_progress: f32,
    pub mean_rate_hz: f64,
    pub channels: Vec<ChannelFrame>,
    pub spikes: Vec<SpikeEvent>,
    pub stims: Vec<StimEvent>,
}

/// REST error payload.
#[derive(Debug, Serialize)]
pub struct ApiError {
    pub error: String,
}
