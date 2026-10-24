//! CL1 Neural Labs — Rust simulation core.
//!
//! Software simulation of a 64-channel microelectrode-array (MEA)
//! neural culture. This is a synthetic model; it is not biological
//! wetware and does not control physical CL1 hardware.

pub mod diagnostics;
pub mod engine;
pub mod experiments;
pub mod hardware;
pub mod types;

pub use engine::NeuralCultureEngine;
pub use hardware::{AdapterError, AdapterInfo, AdapterMode, HardwareAdapter};
pub use types::{
    ApiError, ChannelFrame, CultureConfig, SpikeEvent, StimEvent, StatusReport,
};

/// Number of MEA channels modelled by the simulator.
pub const CHANNELS: usize = 64;
/// Sampling rate of the simulated waveform buffers, in Hz.
pub const SAMPLE_RATE_HZ: f64 = 25_000.0;
/// Length of each channel's waveform ring buffer, in samples.
pub const WAVEFORM_LEN: usize = 256;
