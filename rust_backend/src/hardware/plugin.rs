//! Plugin system for the CL1 Neural Labs backend.
//!
//! A plugin processes `StatusReport` snapshots and can act on them
//! (e.g. closed-loop stimulation, recording, analytics). Plugins are
//! registered in a [`PluginRegistry`] and stepped once per tick.
//!
//! Safety: any plugin that emits stimulation must have it approved by the
//! shared [`safety::SafetyGate`] — plugins receive stimulation requests and
//! the *server*, not the plugin, forwards them through the gate and adapter.

use crate::hardware::safety::SafetyGate;
use crate::types::{StatusReport, StimEvent};
use std::sync::{Arc, Mutex};

/// Requests emitted by a plugin on each tick.
#[derive(Debug, Clone, Default)]
pub struct PluginActions {
    /// Stimulation requests (subject to the server-side safety gate).
    pub stim_requests: Vec<StimEvent>,
    /// Structured log lines for the operator console.
    pub messages: Vec<String>,
}

/// Trait implemented by all backend plugins.
pub trait Plugin: Send {
    fn name(&self) -> &str;
    fn version(&self) -> &str {
        "0.1.0"
    }
    /// Called once per simulation tick with the current report.
    fn on_tick(&mut self, report: &StatusReport) -> PluginActions;
    /// Called once when the plugin is registered.
    fn on_init(&mut self) {}
}

/// Registry that owns and drives plugins.
#[derive(Default)]
pub struct PluginRegistry {
    plugins: Vec<Box<dyn Plugin>>,
}

impl PluginRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register(&mut self, mut plugin: Box<dyn Plugin>) {
        plugin.on_init();
        tracing::info!(plugin = plugin.name(), version = plugin.version(), "plugin registered");
        self.plugins.push(plugin);
    }

    pub fn names(&self) -> Vec<(String, String)> {
        self.plugins
            .iter()
            .map(|p| (p.name().to_string(), p.version().to_string()))
            .collect()
    }

    /// Step all plugins; returns merged actions (gate still applies later).
    pub fn step(&mut self, report: &StatusReport) -> PluginActions {
        let mut merged = PluginActions::default();
        for p in &mut self.plugins {
            let actions = p.on_tick(report);
            merged.stim_requests.extend(actions.stim_requests);
            merged.messages.extend(actions.messages);
        }
        merged
    }
}

/// Shared handle so HTTP handlers can pass plugin stim requests through the
/// safety gate and (in hardware mode) the hardware adapter.
pub type SharedGate = Arc<Mutex<SafetyGate>>;

// ---------------------------------------------------------------------------
// Built-in plugins
// ---------------------------------------------------------------------------

/// Logs burst events and mean firing-rate summaries.
pub struct BurstMonitorPlugin {
    last_burst: bool,
}

impl BurstMonitorPlugin {
    pub fn new() -> Self {
        Self { last_burst: false }
    }
}

impl Default for BurstMonitorPlugin {
    fn default() -> Self {
        Self::new()
    }
}

impl Plugin for BurstMonitorPlugin {
    fn name(&self) -> &str {
        "burst-monitor"
    }

    fn on_tick(&mut self, report: &StatusReport) -> PluginActions {
        let mut actions = PluginActions::default();
        if report.burst_active && !self.last_burst {
            actions
                .messages
                .push(format!("burst started at tick {} (mean rate {:.2} Hz)", report.tick, report.mean_rate_hz));
        }
        self.last_burst = report.burst_active;
        actions
    }
}

/// Closed-loop demo: stimulate a channel when its rate drops below target.
/// All requests are subject to the server-side safety gate.
pub struct ClosedLoopDriverPlugin {
    target_channel: usize,
    rate_floor_hz: f64,
    cooldown_ticks: u64,
    last_fire_tick: u64,
}

impl ClosedLoopDriverPlugin {
    pub fn new(target_channel: usize, rate_floor_hz: f64, cooldown_ticks: u64) -> Self {
        Self {
            target_channel,
            rate_floor_hz,
            cooldown_ticks,
            last_fire_tick: 0,
        }
    }
}

impl Plugin for ClosedLoopDriverPlugin {
    fn name(&self) -> &str {
        "closed-loop-driver"
    }

    fn on_tick(&mut self, report: &StatusReport) -> PluginActions {
        let mut actions = PluginActions::default();
        let Some(ch) = report.channels.get(self.target_channel) else {
            return actions;
        };
        if ch.rate_hz < self.rate_floor_hz
            && report.tick.saturating_sub(self.last_fire_tick) >= self.cooldown_ticks
        {
            self.last_fire_tick = report.tick;
            actions.stim_requests.push(StimEvent {
                channels: vec![self.target_channel],
                amplitude_uv: 150.0,
                duration_ms: 0.4,
                tick: report.tick,
            });
            actions
                .messages
                .push(format!("closed-loop: rate {:.2} Hz below floor on ch {}; queued stim", ch.rate_hz, self.target_channel));
        }
        actions
    }
}

/// Records spike/channel summaries into an in-memory CSV buffer.
pub struct RecorderPlugin {
    csv: String,
    max_rows: usize,
}

impl RecorderPlugin {
    pub fn new(max_rows: usize) -> Self {
        Self {
            csv: "tick,mean_rate_hz,total_spikes,burst_active\n".into(),
            max_rows,
        }
    }

    pub fn csv(&self) -> &str {
        &self.csv
    }
}

impl Plugin for RecorderPlugin {
    fn name(&self) -> &str {
        "recorder"
    }

    fn on_tick(&mut self, report: &StatusReport) -> PluginActions {
        if self.csv.lines().count() - 1 < self.max_rows {
            self.csv.push_str(&format!(
                "{},{:.3},{},{:.0}\n",
                report.tick, report.mean_rate_hz, report.total_spikes, report.burst_active as u8
            ));
        }
        PluginActions::default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::ChannelFrame;

    fn report(rate: f64) -> StatusReport {
        StatusReport {
            tick: 10,
            running: true,
            uptime_s: 1.0,
            total_spikes: 0,
            total_stims: 0,
            burst_active: false,
            burst_progress: 0.0,
            mean_rate_hz: rate,
            channels: vec![ChannelFrame {
                channel: 0,
                baseline_uv: 0.0,
                sample_uv: 0.0,
                rate_hz: rate,
                refractory: false,
                spiked: false,
            }],
            spikes: vec![],
            stims: vec![],
        }
    }

    #[test]
    fn closed_loop_fires_below_floor() {
        let mut p = ClosedLoopDriverPlugin::new(0, 5.0, 10);
        let actions = p.on_tick(&report(1.0));
        assert_eq!(actions.stim_requests.len(), 1);
        // Cooldown prevents immediate re-fire.
        let mut rep = report(1.0);
        rep.tick = 15;
        assert!(p.on_tick(&rep).stim_requests.is_empty());
        rep.tick = 30;
        assert_eq!(p.on_tick(&rep).stim_requests.len(), 1);
    }

    #[test]
    fn recorder_builds_csv() {
        let mut r = RecorderPlugin::new(10);
        r.on_tick(&report(3.0));
        assert!(r.csv().starts_with("tick,mean_rate_hz,total_spikes,burst_active\n10,"));
    }

    #[test]
    fn registry_merges_actions() {
        let mut reg = PluginRegistry::new();
        reg.register(Box::new(BurstMonitorPlugin::new()));
        reg.register(Box::new(ClosedLoopDriverPlugin::new(0, 5.0, 0)));
        let actions = reg.step(&report(1.0));
        assert!(!actions.stim_requests.is_empty());
    }
}
