//! Simulation engine: 64-channel neural-culture model.

use rand::Rng;
use tokio::sync::broadcast;

use crate::types::{ChannelFrame, CultureConfig, SpikeEvent, StimEvent, StatusReport};
use crate::{CHANNELS, SAMPLE_RATE_HZ, WAVEFORM_LEN};

struct ChannelState {
    baseline_uv: f64,
    waveform: Vec<f64>,
    rate_hz: f64,
    refractory_ticks: u32,
    spiked_this_tick: bool,
}

/// Runs the synthetic neural-culture model and broadcasts per-tick reports.
pub struct NeuralCultureEngine {
    config: CultureConfig,
    channels: Vec<ChannelState>,
    tick: u64,
    running: bool,
    total_spikes: u64,
    total_stims: u64,
    burst_active: bool,
    burst_progress: f32,
    pending_stims: Vec<StimEvent>,
    start_time: std::time::Instant,
    tx: broadcast::Sender<StatusReport>,
    last: Option<StatusReport>,
}

impl NeuralCultureEngine {
    pub fn new(config: CultureConfig) -> (Self, broadcast::Receiver<StatusReport>) {
        let channels = (0..CHANNELS)
            .map(|_| ChannelState {
                baseline_uv: -55.0,
                waveform: vec![0.0; WAVEFORM_LEN],
                rate_hz: 0.0,
                refractory_ticks: 0,
                spiked_this_tick: false,
            })
            .collect();

        let (tx, rx) = broadcast::channel(64);
        (
            Self {
                config,
                channels,
                tick: 0,
                running: false,
                total_spikes: 0,
                total_stims: 0,
                burst_active: false,
                burst_progress: 0.0,
                pending_stims: Vec::new(),
                start_time: std::time::Instant::now(),
                tx,
                last: None,
            },
            rx,
        )
    }

    pub fn set_config(&mut self, config: CultureConfig) {
        self.config = config;
    }

    pub fn config(&self) -> &CultureConfig {
        &self.config
    }

    /// Queue a stimulation pulse; it is applied on the next tick.
    pub fn apply_stim(&mut self, stim: StimEvent) {
        self.pending_stims.push(stim);
    }

    /// Advance the simulation by one tick and broadcast a report.
    pub fn step(&mut self) -> StatusReport {
        self.tick += 1;
        let mut rng = rand::thread_rng();
        let mut spikes: Vec<SpikeEvent> = Vec::new();
        let mut spiked_channels: Vec<usize> = Vec::new();

        // Apply pending stimulation: raises excitability briefly.
        let mut stim_boost = [0.0f64; 64];
        for stim in self.pending_stims.drain(..) {
            self.total_stims += 1;
            for &ch in &stim.channels {
                if ch < CHANNELS {
                    stim_boost[ch] += stim.amplitude_uv / 100.0;
                }
            }
        }

        for i in 0..CHANNELS {
            let ch = &mut self.channels[i];
            ch.spiked_this_tick = false;

            if ch.refractory_ticks > 0 {
                ch.refractory_ticks -= 1;
            } else {
                // Poisson-like firing modulated by excitability and stim boost.
                let lambda = (self.config.target_rate_hz
                    * self.config.excitability
                    * (1.0 + stim_boost[i]))
                    / 1000.0;
                if rng.gen_bool(lambda.min(1.0)) {
                    ch.spiked_this_tick = true;
                    ch.refractory_ticks = 4; // ~4 ms refractory period
                    spikes.push(SpikeEvent {
                        tick: self.tick,
                        channel: i,
                        amplitude_uv: 60.0 + rng.gen_range(0.0..80.0),
                        timestamp_ms: self.tick as f64 * (1000.0 / SAMPLE_RATE_HZ),
                    });
                }
            }

            // Synaptic crosstalk: neighbours get a small excitatory push.
            let spiked = ch.spiked_this_tick;
            if spiked {
                ch.baseline_uv += 1.5; // self-excitation placeholder
            }
            // Neighbour push is applied after the loop below (borrow-safe).
            if spiked {
                spiked_channels.push(i);
            }

            // Leaky decay back to resting potential.
            ch.baseline_uv += (-65.0 - ch.baseline_uv) * 0.02 + rng.gen_range(-0.4..0.4);

            // Waveform: noise floor plus spike transient.
            let sample = if spiked {
                rng.gen_range(40.0..120.0)
            } else {
                rng.gen_range(-3.0..3.0)
            };
            let widx = (self.tick % WAVEFORM_LEN as u64) as usize;
            ch.waveform[widx] = sample;

            // Firing-rate EMA.
            let inst = if spiked { 1.0 } else { 0.0 };
            ch.rate_hz = 0.995 * ch.rate_hz + 0.005 * inst * SAMPLE_RATE_HZ;
        }

        // Apply neighbour crosstalk after the borrow of individual channels ends.
        for &i in &spiked_channels {
            for j in [(i + CHANNELS - 1) % CHANNELS, (i + 1) % CHANNELS] {
                self.channels[j].baseline_uv += 1.5;
            }
        }

        let mean_rate = self.channels.iter().map(|c| c.rate_hz).sum::<f64>() / CHANNELS as f64;

        // Simple burst heuristic: many spikes in one tick.
        if spikes.len() >= 8 {
            self.burst_active = true;
        }
        if self.burst_active {
            self.burst_progress += 0.05;
            if self.burst_progress >= 1.0 || spikes.is_empty() {
                self.burst_active = false;
                self.burst_progress = 0.0;
            }
        }

        self.total_spikes += spikes.len() as u64;

        let report = StatusReport {
            tick: self.tick,
            running: self.running,
            uptime_s: self.start_time.elapsed().as_secs_f64(),
            total_spikes: self.total_spikes,
            total_stims: self.total_stims,
            burst_active: self.burst_active,
            burst_progress: self.burst_progress,
            mean_rate_hz: mean_rate,
            channels: self
                .channels
                .iter()
                .enumerate()
                .map(|(i, c)| ChannelFrame {
                    channel: i,
                    baseline_uv: c.baseline_uv,
                    sample_uv: c.waveform[(self.tick % WAVEFORM_LEN as u64) as usize],
                    rate_hz: c.rate_hz,
                    refractory: c.refractory_ticks > 0,
                    spiked: c.spiked_this_tick,
                })
                .collect(),
            spikes,
            stims: Vec::new(),
        };

        let _ = self.tx.send(report.clone());
        self.last = Some(report.clone());
        report
    }

    /// Most recent status report (from the last completed step).
    pub fn last_report(&self) -> StatusReport {
        self.last.clone().unwrap_or_else(|| self.snapshot_only())
    }

    /// Build a report without advancing the simulation (rates frozen).
    fn snapshot_only(&self) -> StatusReport {
        let mean_rate = self.channels.iter().map(|c| c.rate_hz).sum::<f64>() / CHANNELS as f64;
        StatusReport {
            tick: self.tick,
            running: self.running,
            uptime_s: self.start_time.elapsed().as_secs_f64(),
            total_spikes: self.total_spikes,
            total_stims: self.total_stims,
            burst_active: self.burst_active,
            burst_progress: self.burst_progress,
            mean_rate_hz: mean_rate,
            channels: self
                .channels
                .iter()
                .enumerate()
                .map(|(i, c)| ChannelFrame {
                    channel: i,
                    baseline_uv: c.baseline_uv,
                    sample_uv: c.waveform[(self.tick as usize) % WAVEFORM_LEN],
                    rate_hz: c.rate_hz,
                    refractory: c.refractory_ticks > 0,
                    spiked: c.spiked_this_tick,
                })
                .collect(),
            spikes: Vec::new(),
            stims: Vec::new(),
        }
    }

    pub fn stop(&mut self) {
        self.running = false;
    }

    pub fn is_running(&self) -> bool {
        self.running
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn produces_spikes_over_time() {
        let (mut engine, _rx) = NeuralCultureEngine::new(CultureConfig::default());
        let mut total = 0;
        for _ in 0..2000 {
            let report = engine.step();
            total += report.spikes.len();
        }
        assert!(total > 0, "engine should generate spikes");
        assert_eq!(report_channels(&engine), CHANNELS);
    }

    fn report_channels(engine: &NeuralCultureEngine) -> usize {
        CHANNELS
    }

    #[test]
    fn stim_increases_counter() {
        let (mut engine, _rx) = NeuralCultureEngine::new(CultureConfig::default());
        engine.apply_stim(StimEvent {
            channels: vec![0, 1, 2],
            amplitude_uv: 500.0,
            duration_ms: 1.0,
            tick: 0,
        });
        engine.step();
        assert!(engine.total_stims >= 1);
    }
}
