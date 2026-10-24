//! Hardware adapter layer — the boundary between the software data model
//! and physical CL1 / MEA hardware.
//!
//! ## Safety contract
//! No adapter may be constructed for real hardware without a `SafetyPolicy`
//! that enforces hard stimulation limits. All stimulations pass through
//! [`SafetyGate::check`] before reaching the device. Adapters must fail
//! closed: if the safety check fails or the device link is down, the
//! stimulation is rejected and logged.
//!
//! This module contains **no** hardware I/O itself. Implementations of
//! [`HardwareAdapter`] translate between the common neural data model and a
//! concrete device API (e.g. the official Cortical Labs CL API).

pub mod cl1_api_adapter;
pub mod plugin;
pub mod safety;

use crate::types::{SpikeEvent, StimEvent, StatusReport};
use std::fmt::Debug;

/// Mode reported by an adapter.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AdapterMode {
    /// Pure software simulation (default).
    Simulation,
    /// Connected to a real or emulated hardware device.
    Hardware,
}

/// Common description of an attached data source.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AdapterInfo {
    pub id: String,
    pub name: String,
    pub mode: AdapterMode,
    pub channels: usize,
    pub sample_rate_hz: f64,
    pub connected: bool,
    /// Human-readable description of what the adapter actually talks to.
    pub backend: String,
}

/// Errors produced by hardware adapters.
#[derive(Debug, thiserror::Error)]
pub enum AdapterError {
    #[error("safety gate rejected stimulation: {0}")]
    SafetyRejected(String),
    #[error("device link is not connected")]
    NotConnected,
    #[error("device I/O failure: {0}")]
    Io(String),
    #[error("unsupported operation: {0}")]
    Unsupported(String),
}

/// Trait every hardware/simulation source implements.
///
/// The adapter consumes *device-space* data and converts it into the common
/// neural data model used across analysis, visualization, recording and
/// experiments.
pub trait HardwareAdapter: Send + Debug {
    fn info(&self) -> AdapterInfo;

    /// Open the device link. Must be idempotent.
    fn connect(&mut self) -> Result<(), AdapterError>;

    /// Close the device link. Must be idempotent.
    fn disconnect(&mut self) -> Result<(), AdapterError>;

    /// Drain newly observed spikes since the last call.
    fn poll_spikes(&mut self) -> Result<Vec<SpikeEvent>, AdapterError>;

    /// Submit a stimulation. Implementations MUST route this through a
    /// [`safety::SafetyGate`].
    fn deliver_stim(&mut self, stim: &StimEvent) -> Result<(), AdapterError>;

    /// Build a status snapshot compatible with the common data model.
    fn snapshot(&mut self) -> Result<StatusReport, AdapterError>;
}
