//! Closed-loop experiment suite for the CL1 synthetic culture.
//!
//! Each experiment is a runnable protocol: it observes culture state and
//! produces stimulation requests (always subject to the safety gate) plus a
//! score. All experiments are simulations over synthetic neural activity.

use crate::types::{StatusReport, StimEvent};
use serde::{Deserialize, Serialize};

/// Result of running one experiment step.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExperimentStep {
    pub experiment: String,
    pub tick: u64,
    pub score: f64,
    pub trials: u64,
    pub stim_requests: Vec<StimEvent>,
    pub observation: String,
    pub done: bool,
}

/// Result at the end of an experiment run.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExperimentSummary {
    pub experiment: String,
    pub total_ticks: u64,
    pub final_score: f64,
    pub trials_completed: u64,
    pub success_rate: f64,
    pub notes: String,
}

/// Behaviour every experiment implements.
pub trait Experiment: Send {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    /// One closed-loop step given the current culture report.
    fn step(&mut self, report: &StatusReport) -> ExperimentStep;
    fn summary(&self) -> ExperimentSummary;
    fn trials(&self) -> u64;
    fn score(&self) -> f64;
}

/// Shared bookkeeping for simple closed-loop experiments.
#[derive(Debug, Default, Clone)]
struct Bookkeeping {
    ticks: u64,
    score: f64,
    trials: u64,
    successes: u64,
}

impl Bookkeeping {
    fn step_tick(&mut self) -> u64 {
        self.ticks += 1;
        self.ticks
    }
    fn record(&mut self, success: bool, points: f64) {
        self.trials += 1;
        if success {
            self.successes += 1;
        }
        self.score += points;
    }
    fn success_rate(&self) -> f64 {
        if self.trials == 0 {
            0.0
        } else {
            self.successes as f64 / self.trials as f64
        }
    }
}

fn finish(exp: &str, book: &Bookkeeping, notes: &str) -> ExperimentSummary {
    ExperimentSummary {
        experiment: exp.into(),
        total_ticks: book.ticks,
        final_score: book.score,
        trials_completed: book.trials,
        success_rate: book.success_rate(),
        notes: notes.into(),
    }
}

fn mean_rate(report: &StatusReport) -> f64 {
    report.mean_rate_hz
}

fn rate_of(report: &StatusReport, channel: usize) -> f64 {
    report.channels.get(channel).map(|c| c.rate_hz).unwrap_or(0.0)
}

/// Sum of rates over a channel window (a crude "population activity" readout).
fn window_rate(report: &StatusReport, start: usize, len: usize) -> f64 {
    report.channels[start..(start + len).min(report.channels.len())]
        .iter()
        .map(|c| c.rate_hz)
        .sum()
}

macro_rules! make_experiment {
    ($ty:ident, $name:expr, $desc:expr) => {
        #[derive(Debug)]
        pub struct $ty {
            book: Bookkeeping,
            done: bool,
        }
        impl $ty {
            pub fn new() -> Self {
                Self { book: Bookkeeping::default(), done: false }
            }
        }
        impl Default for $ty {
            fn default() -> Self {
                Self::new()
            }
        }
        impl Experiment for $ty {
            fn name(&self) -> &str {
                $name
            }
            fn description(&self) -> &str {
                $desc
            }
            fn trials(&self) -> u64 {
                self.book.trials
            }
            fn score(&self) -> f64 {
                self.book.score
            }
            fn summary(&self) -> ExperimentSummary {
                finish($name, &self.book, "synthetic closed-loop run")
            }
            fn step(&mut self, report: &StatusReport) -> ExperimentStep {
                let tick = self.book.step_tick();
                let (obs, reqs, points, success, done) = self.run_tick(report, tick);
                self.book.record(success, points);
                self.done = self.done || done;
                ExperimentStep {
                    experiment: $name.into(),
                    tick,
                    score: self.book.score,
                    trials: self.book.trials,
                    stim_requests: reqs,
                    observation: obs,
                    done: self.done,
                }
            }
        }
    };
}

// 1. DishBrain-style Pong: paddle follows the side with higher activity.
make_experiment!(PongExperiment, "pong", "DishBrain-style Pong: paddle tracks the hemisphere with higher firing");
impl PongExperiment {
    fn run_tick(
        &mut self,
        report: &StatusReport,
        tick: u64,
    ) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let left = window_rate(report, 0, 32);
        let right = window_rate(report, 32, 32);
        let paddle_hit = (left - right).abs() > 5.0; // paddle aligned when hemispheres differ
        let reqs = if !paddle_hit {
            vec![StimEvent {
                channels: vec![if left > right { 40 } else { 8 }],
                amplitude_uv: 120.0,
                duration_ms: 0.4,
                tick,
            }]
        } else {
            vec![]
        };
        let done = tick >= 500;
        (
            format!("left={left:.1} right={right:.1} paddle_aligned={paddle_hit}"),
            reqs,
            if paddle_hit { 1.0 } else { 0.0 },
            paddle_hit,
            done,
        )
    }
}

// 2. Associative conditioning: pair stim of ch0+ch1, test response on ch2.
make_experiment!(AssociativeConditioningExperiment, "associative-conditioning",
    "Pair ch0+ch1 stimulation, then test whether ch2 responds (synthetic Hebbian pairing)");
impl AssociativeConditioningExperiment {
    fn run_tick(
        &mut self,
        report: &StatusReport,
        tick: u64,
    ) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let phase = tick % 20;
        if phase < 5 {
            return (
                "pairing phase: co-stimulate ch0+ch1".into(),
                vec![StimEvent {
                    channels: vec![0, 1],
                    amplitude_uv: 150.0,
                    duration_ms: 0.4,
                    tick,
                }],
                0.0,
                false,
                tick >= 2000,
            );
        }
        if phase == 10 {
            let resp = rate_of(report, 2);
            let success = resp > 2.0;
            return (
                format!("test phase: ch2 response {resp:.2} Hz"),
                vec![StimEvent { channels: vec![0], amplitude_uv: 150.0, duration_ms: 0.4, tick }],
                if success { 2.0 } else { 0.0 },
                success,
                tick >= 2000,
            );
        }
        ("rest".into(), vec![], 0.0, false, tick >= 2000)
    }
}

// 3. Maze navigation: left/right activity encodes turn decisions.
make_experiment!(MazeNavigationExperiment, "maze-navigation",
    "Navigate a synthetic maze using population activity to choose turns");
impl MazeNavigationExperiment {
    fn run_tick(
        &mut self,
        report: &StatusReport,
        tick: u64,
    ) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let decision = if rate_of(report, 10) > rate_of(report, 50) { "left" } else { "right" };
        let correct = (tick / 50) % 2 == if decision == "left" { 0 } else { 1 };
        let done = tick >= 1000;
        (
            format!("turn={decision} (synthetic reward={correct})"),
            vec![StimEvent {
                channels: vec![if decision == "left" { 20 } else { 44 }],
                amplitude_uv: 100.0,
                duration_ms: 0.3,
                tick,
            }],
            if correct { 1.0 } else { -0.2 },
            correct,
            done,
        )
    }
}

// 4. Burst detection & characterization
make_experiment!(BurstCharacterizationExperiment, "burst-characterization",
    "Detect and measure synthetic network bursts");
impl BurstCharacterizationExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let detected = report.burst_active;
        let done = tick >= 800;
        (format!("burst_active={detected} progress={:.2}", report.burst_progress), vec![], if detected { 1.0 } else { 0.0 }, detected, done)
    }
}

// 5. Sensory evoked potential: stim then measure response latency.
make_experiment!(EvokedPotentialExperiment, "evoked-potential",
    "Stimulate ch0 and measure the evoked response on ch1 (latency/ amplitude)");
impl EvokedPotentialExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        if tick % 30 == 0 {
            return (
                "stim pulse on ch0".into(),
                vec![StimEvent { channels: vec![0], amplitude_uv: 180.0, duration_ms: 0.5, tick }],
                0.0,
                false,
                tick >= 1200,
            );
        }
        if tick % 30 == 3 {
            let resp = rate_of(report, 1);
            let success = resp > 1.0;
            return (format!("evoked response ch1={resp:.2} Hz"), vec![], if success { 1.5 } else { 0.0 }, success, tick >= 1200);
        }
        ("listening".into(), vec![], 0.0, false, tick >= 1200)
    }
}

// 6. Habituation: repeated stim, response should decline.
make_experiment!(HabituationExperiment, "habituation",
    "Repeated identical stimulation; measure response decline (synthetic habituation)");
impl HabituationExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        if tick % 10 == 0 {
            return (
                "repeated stim ch5".into(),
                vec![StimEvent { channels: vec![5], amplitude_uv: 140.0, duration_ms: 0.4, tick }],
                0.0,
                false,
                tick >= 1000,
            );
        }
        let resp = rate_of(report, 5);
        let declining = resp < 5.0;
        (format!("ch5 response {resp:.2} Hz"), vec![], if declining { 0.5 } else { 0.0 }, declining, tick >= 1000)
    }
}

// 7. Sensitization: strong novel stim increases later responses.
make_experiment!(SensitizationExperiment, "sensitization",
    "Strong stimulus then test global response increase");
impl SensitizationExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        if tick % 50 == 0 {
            return (
                "strong sensitizing stim".into(),
                vec![StimEvent { channels: vec![7, 8, 9], amplitude_uv: 250.0, duration_ms: 0.6, tick }],
                0.0,
                false,
                tick >= 1000,
            );
        }
        let mr = mean_rate(report);
        let success = mr > 4.0;
        (format!("mean rate {mr:.2} Hz"), vec![], if success { 0.5 } else { 0.0 }, success, tick >= 1000)
    }
}

// 8. Sleep/wake-like oscillation cycling
make_experiment!(OscillationCyclingExperiment, "oscillation-cycling",
    "Drive slow oscillation cycles (delta-like vs gamma-like epochs)");
impl OscillationCyclingExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let slow_phase = (tick / 100) % 2 == 0;
        let target = if slow_phase { 1.0 } else { 8.0 };
        let mr = mean_rate(report);
        let ok = if slow_phase { mr < target * 2.0 } else { mr > target * 0.5 };
        (format!("phase={} mean_rate={mr:.2}", if slow_phase { "slow" } else { "fast" }), vec![], if ok { 0.5 } else { 0.0 }, ok, tick >= 2000)
    }
}

// 9. Adaptive filtering / noise rejection
make_experiment!(NoiseRejectionExperiment, "noise-rejection",
    "Stimulate during high noise epochs; measure signal-to-noise improvement");
impl NoiseRejectionExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let noisy = tick % 40 < 10;
        if !noisy && tick % 20 == 0 {
            return (
                "clean-phase stim ch12".into(),
                vec![StimEvent { channels: vec![12], amplitude_uv: 160.0, duration_ms: 0.4, tick }],
                0.0,
                false,
                tick >= 1200,
            );
        }
        let resp = rate_of(report, 12);
        let success = !noisy && resp > 1.0;
        (format!("noisy={noisy} ch12={resp:.2}"), vec![], if success { 1.0 } else { 0.0 }, success, tick >= 1200)
    }
}

// 10. Functional connectivity estimation (paired-correlation style)
make_experiment!(ConnectivityMappingExperiment, "connectivity-mapping",
    "Estimate synthetic functional connectivity between channel pairs");
impl ConnectivityMappingExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        if tick % 25 == 0 {
            let a = (tick / 25) as usize % 32;
            return (
                format!("probe pair ({a},{})", a + 32),
                vec![StimEvent { channels: vec![a], amplitude_uv: 130.0, duration_ms: 0.4, tick }],
                0.0,
                false,
                tick >= 1600,
            );
        }
        if tick % 25 == 5 {
            let a = ((tick - 5) / 25) as usize % 32;
            let corr = rate_of(report, a + 32) > 1.0;
            return (format!("pair ({a},{}) correlated={corr}", a + 32), vec![], if corr { 1.0 } else { 0.0 }, corr, tick >= 1600);
        }
        ("passive".into(), vec![], 0.0, false, tick >= 1600)
    }
}

// 11. Homeostatic regulation: keep mean rate in a target band.
make_experiment!(HomeostasisExperiment, "homeostasis",
    "Closed-loop regulation of mean firing rate into 3–6 Hz band");
impl HomeostasisExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let mr = mean_rate(report);
        let in_band = (3.0..=6.0).contains(&mr);
        let reqs = if mr < 3.0 {
            vec![StimEvent { channels: vec![0, 16, 32, 48], amplitude_uv: 120.0, duration_ms: 0.4, tick }]
        } else {
            vec![]
        };
        (format!("mean_rate={mr:.2} in_band={in_band}"), reqs, if in_band { 1.0 } else { 0.0 }, in_band, tick >= 1500)
    }
}

// 12. Synaptic plasticity probe (pairing protocol)
make_experiment!(PlasticityPairingExperiment, "plasticity-pairing",
    "STDP-like pre/post pairing protocol (synthetic LTP/LTD probe)");
impl PlasticityPairingExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        if tick % 15 == 0 {
            return (
                "pre-post pairing ch20->ch21".into(),
                vec![StimEvent { channels: vec![20], amplitude_uv: 140.0, duration_ms: 0.3, tick },
                     StimEvent { channels: vec![21], amplitude_uv: 140.0, duration_ms: 0.3, tick }],
                0.0,
                false,
                tick >= 1500,
            );
        }
        if tick % 15 == 5 {
            let resp = rate_of(report, 21);
            let potentiated = resp > 2.0;
            return (format!("ch21 response {resp:.2} (potentiated={potentiated})"), vec![], if potentiated { 2.0 } else { 0.0 }, potentiated, tick >= 1500);
        }
        ("baseline".into(), vec![], 0.0, false, tick >= 1500)
    }
}

// 13. Working memory: delayed match-to-sample
make_experiment!(WorkingMemoryExperiment, "working-memory",
    "Delayed match-to-sample: encode a sample, delay, then test recall");
impl WorkingMemoryExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let phase = tick % 60;
        if phase == 0 {
            return ("encode: sample stim ch30".into(), vec![StimEvent { channels: vec![30], amplitude_uv: 200.0, duration_ms: 0.5, tick }], 0.0, false, tick >= 1800);
        }
        if phase == 40 {
            let recall = rate_of(report, 30) > rate_of(report, 31);
            return (format!("probe: recall ch30 active={recall}"), vec![], if recall { 2.0 } else { 0.0 }, recall, tick >= 1800);
        }
        ("delay".into(), vec![], 0.0, false, tick >= 1800)
    }
}

// 14. Attention (winner-take-all between two populations)
make_experiment!(AttentionWtaExperiment, "attention-wta",
    "Winner-take-all attention between two channel populations");
impl AttentionWtaExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let a = window_rate(report, 24, 8);
        let b = window_rate(report, 40, 8);
        let winner = if a > b { "A" } else { "B" };
        let boost = vec![StimEvent {
            channels: vec![if a > b { 24 } else { 40 }],
            amplitude_uv: 110.0,
            duration_ms: 0.3,
            tick,
        }];
        (format!("winner={winner} a={a:.1} b={b:.1}"), boost, 0.25, true, tick >= 1000)
    }
}

// 15. Decision making under uncertainty (two-armed bandit)
make_experiment!(BanditDecisionExperiment, "bandit-decision",
    "Two-armed bandit: choose between two populations by relative activity");
impl BanditDecisionExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let choose_a = rate_of(report, 3) >= rate_of(report, 60);
        let reward = choose_a; // synthetic: arm A pays off
        let reqs = vec![StimEvent {
            channels: vec![if choose_a { 3 } else { 60 }],
            amplitude_uv: 125.0,
            duration_ms: 0.4,
            tick,
        }];
        (format!("chose={} reward={reward}", if choose_a { "A" } else { "B" }), reqs, if reward { 1.0 } else { -0.5 }, reward, tick >= 1200)
    }
}

// 16. Seizure susceptibility / afterdischarge screen
make_experiment!(AfterdischargeExperiment, "afterdischarge-screen",
    "Deliver a pulse train and check for afterdischarge-like runaway activity");
impl AfterdischargeExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        if tick % 80 == 0 {
            return (
                "pulse train ch2".into(),
                vec![StimEvent { channels: vec![2], amplitude_uv: 220.0, duration_ms: 0.8, tick }],
                0.0,
                false,
                tick >= 1600,
            );
        }
        let runaway = mean_rate(report) > 15.0;
        let safe = !runaway;
        (format!("runaway={runaway}"), vec![], if safe { 1.0 } else { -1.0 }, safe, tick >= 1600)
    }
}

// 17. Chronametric timing / interval estimation
make_experiment!(IntervalTimingExperiment, "interval-timing",
    "Measure whether the culture tracks a fixed inter-stimulus interval");
impl IntervalTimingExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        if tick % 50 == 0 {
            return ("interval stim".into(), vec![StimEvent { channels: vec![15], amplitude_uv: 150.0, duration_ms: 0.4, tick }], 0.0, false, tick >= 1500);
        }
        if tick % 50 == 10 {
            let anticip = rate_of(report, 15);
            let success = anticip > 1.0;
            return (format!("anticipatory activity={anticip:.2}"), vec![], if success { 1.0 } else { 0.0 }, success, tick >= 1500);
        }
        ("waiting".into(), vec![], 0.0, false, tick >= 1500)
    }
}

// 18. Sensory adaptation to contrast changes
make_experiment!(ContrastAdaptationExperiment, "contrast-adaptation",
    "Alternate high/low contrast stimulation; track adaptation of responses");
impl ContrastAdaptationExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let high = (tick / 30) % 2 == 0;
        let amp = if high { 220.0 } else { 60.0 };
        let reqs = if tick % 30 == 0 {
            vec![StimEvent { channels: vec![33], amplitude_uv: amp, duration_ms: 0.4, tick }]
        } else {
            vec![]
        };
        let resp = rate_of(report, 33);
        let success = if high { resp > 1.0 } else { resp < 6.0 };
        (format!("contrast={} ch33={resp:.2}", if high { "high" } else { "low" }), reqs, if success { 0.8 } else { 0.0 }, success, tick >= 1200)
    }
}

// 19. Pattern completion (partial cue → full recall)
make_experiment!(PatternCompletionExperiment, "pattern-completion",
    "Cue half a trained channel set, check completion of the other half");
impl PatternCompletionExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        if tick % 45 == 0 {
            return ("cue half pattern ch40-43".into(), vec![StimEvent { channels: vec![40, 41, 42, 43], amplitude_uv: 170.0, duration_ms: 0.5, tick }], 0.0, false, tick >= 1350);
        }
        if tick % 45 == 8 {
            let completion = window_rate(report, 44, 4) > 2.0;
            return (format!("completion of ch44-47={completion}"), vec![], if completion { 2.0 } else { 0.0 }, completion, tick >= 1350);
        }
        ("delay".into(), vec![], 0.0, false, tick >= 1350)
    }
}

// 20. Reafference / efference-copy style cancellation
make_experiment!(ReafferenceExperiment, "reafference",
    "Test whether self-generated (stim-driven) activity is 'cancelled' vs external");
impl ReafferenceExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        if tick % 35 == 0 {
            return ("self-generated pulse ch50".into(), vec![StimEvent { channels: vec![50], amplitude_uv: 140.0, duration_ms: 0.4, tick }], 0.0, false, tick >= 1050);
        }
        if tick % 35 == 4 {
            let suppressed = rate_of(report, 50) < 8.0;
            return (format!("reafference suppression={suppressed}"), vec![], if suppressed { 1.0 } else { 0.0 }, suppressed, tick >= 1050);
        }
        ("monitor".into(), vec![], 0.0, false, tick >= 1050)
    }
}

// 21. Go/no-go response inhibition
make_experiment!(GoNoGoExperiment, "go-no-go",
    "Respond to 'go' (high beta) cues, withhold on 'no-go' (high delta) epochs");
impl GoNoGoExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let beta_dom = rate_of(report, 26) > rate_of(report, 4);
        let reqs = if beta_dom {
            vec![StimEvent { channels: vec![26], amplitude_uv: 130.0, duration_ms: 0.4, tick }]
        } else {
            vec![]
        };
        let correct = beta_dom; // responded only on go trials
        (format!("cue={} responded={beta_dom}", if beta_dom { "go" } else { "no-go" }), reqs, if correct { 1.0 } else { -0.5 }, correct, tick >= 1400)
    }
}

// 22. Place-field-like spatial tuning
make_experiment!(PlaceFieldExperiment, "place-field",
    "Synthetic spatial tuning: reward activity in a 'place' channel window");
impl PlaceFieldExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let place = (tick / 40) % 8; // synthetic position 0..8
        let ch = 20 + place * 3;
        let act = rate_of(report, ch as usize);
        let in_field = act > 2.0;
        (format!("position={place} ch{ch} activity={act:.2}"), vec![], if in_field { 1.0 } else { 0.0 }, in_field, tick >= 1600)
    }
}

// 23. Replay / sequence reactivation after experience
make_experiment!(ReplayExperiment, "replay-detection",
    "Detect sequential reactivation of channels after a training episode");
impl ReplayExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        if tick % 60 < 20 {
            // training: stimulate a sequence
            let idx = (tick % 60) / 5;
            return (
                format!("training seq step {idx}"),
                vec![StimEvent { channels: vec![(10 + idx * 2) as usize], amplitude_uv: 160.0, duration_ms: 0.4, tick }],
                0.0,
                false,
                tick >= 1800,
            );
        }
        let reactivation = window_rate(report, 10, 16) > 4.0;
        (format!("post-training reactivation={reactivation}"), vec![], if reactivation { 1.5 } else { 0.0 }, reactivation, tick >= 1800)
    }
}

// 24. Adaptive stimulation (closed-loop dose finding)
make_experiment!(AdaptiveDoseExperiment, "adaptive-dose",
    "Closed-loop dose titration to hold response in a target window");
impl AdaptiveDoseExperiment {
    fn run_tick(&mut self, report: &StatusReport, tick: u64) -> (String, Vec<StimEvent>, f64, bool, bool) {
        let resp = rate_of(report, 55);
        let target_lo = 2.0;
        let target_hi = 5.0;
        let amp = if resp < target_lo {
            200.0
        } else if resp > target_hi {
            80.0
        } else {
            140.0
        };
        let in_window = (target_lo..=target_hi).contains(&resp);
        (format!("ch55={resp:.2} dose_amp={amp}"), vec![StimEvent { channels: vec![55], amplitude_uv: amp, duration_ms: 0.4, tick }], if in_window { 1.0 } else { 0.1 }, in_window, tick >= 1500)
    }
}

/// Registry of all built-in experiments.
pub fn builtin_experiments() -> Vec<(&'static str, String)> {
    vec![
        ("pong", PongExperiment::new().description_of()),
        ("associative-conditioning", AssociativeConditioningExperiment::new().description_of()),
        ("maze-navigation", MazeNavigationExperiment::new().description_of()),
        ("burst-characterization", BurstCharacterizationExperiment::new().description_of()),
        ("evoked-potential", EvokedPotentialExperiment::new().description_of()),
        ("habituation", HabituationExperiment::new().description_of()),
        ("sensitization", SensitizationExperiment::new().description_of()),
        ("oscillation-cycling", OscillationCyclingExperiment::new().description_of()),
        ("noise-rejection", NoiseRejectionExperiment::new().description_of()),
        ("connectivity-mapping", ConnectivityMappingExperiment::new().description_of()),
        ("homeostasis", HomeostasisExperiment::new().description_of()),
        ("plasticity-pairing", PlasticityPairingExperiment::new().description_of()),
        ("working-memory", WorkingMemoryExperiment::new().description_of()),
        ("attention-wta", AttentionWtaExperiment::new().description_of()),
        ("bandit-decision", BanditDecisionExperiment::new().description_of()),
        ("afterdischarge-screen", AfterdischargeExperiment::new().description_of()),
        ("interval-timing", IntervalTimingExperiment::new().description_of()),
        ("contrast-adaptation", ContrastAdaptationExperiment::new().description_of()),
        ("pattern-completion", PatternCompletionExperiment::new().description_of()),
        ("reafference", ReafferenceExperiment::new().description_of()),
        ("go-no-go", GoNoGoExperiment::new().description_of()),
        ("place-field", PlaceFieldExperiment::new().description_of()),
        ("replay-detection", ReplayExperiment::new().description_of()),
        ("adaptive-dose", AdaptiveDoseExperiment::new().description_of()),
    ]
}

trait DescriptionOf {
    fn description_of(&self) -> String;
}

impl<T: Experiment> DescriptionOf for T {
    fn description_of(&self) -> String {
        self.description().to_string()
    }
}

/// Construct a fresh experiment instance by name.
pub fn experiment_by_name(name: &str) -> Option<Box<dyn Experiment>> {
    match name {
        "pong" => Some(Box::new(PongExperiment::new())),
        "associative-conditioning" => Some(Box::new(AssociativeConditioningExperiment::new())),
        "maze-navigation" => Some(Box::new(MazeNavigationExperiment::new())),
        "burst-characterization" => Some(Box::new(BurstCharacterizationExperiment::new())),
        "evoked-potential" => Some(Box::new(EvokedPotentialExperiment::new())),
        "habituation" => Some(Box::new(HabituationExperiment::new())),
        "sensitization" => Some(Box::new(SensitizationExperiment::new())),
        "oscillation-cycling" => Some(Box::new(OscillationCyclingExperiment::new())),
        "noise-rejection" => Some(Box::new(NoiseRejectionExperiment::new())),
        "connectivity-mapping" => Some(Box::new(ConnectivityMappingExperiment::new())),
        "homeostasis" => Some(Box::new(HomeostasisExperiment::new())),
        "plasticity-pairing" => Some(Box::new(PlasticityPairingExperiment::new())),
        "working-memory" => Some(Box::new(WorkingMemoryExperiment::new())),
        "attention-wta" => Some(Box::new(AttentionWtaExperiment::new())),
        "bandit-decision" => Some(Box::new(BanditDecisionExperiment::new())),
        "afterdischarge-screen" => Some(Box::new(AfterdischargeExperiment::new())),
        "interval-timing" => Some(Box::new(IntervalTimingExperiment::new())),
        "contrast-adaptation" => Some(Box::new(ContrastAdaptationExperiment::new())),
        "pattern-completion" => Some(Box::new(PatternCompletionExperiment::new())),
        "reafference" => Some(Box::new(ReafferenceExperiment::new())),
        "go-no-go" => Some(Box::new(GoNoGoExperiment::new())),
        "place-field" => Some(Box::new(PlaceFieldExperiment::new())),
        "replay-detection" => Some(Box::new(ReplayExperiment::new())),
        "adaptive-dose" => Some(Box::new(AdaptiveDoseExperiment::new())),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::ChannelFrame;

    fn fake_report(mean: f64) -> StatusReport {
        StatusReport {
            tick: 1,
            running: true,
            uptime_s: 0.0,
            total_spikes: 0,
            total_stims: 0,
            burst_active: false,
            burst_progress: 0.0,
            mean_rate_hz: mean,
            channels: (0..crate::CHANNELS)
                .map(|i| ChannelFrame {
                    channel: i,
                    baseline_uv: 0.0,
                    sample_uv: 0.0,
                    rate_hz: mean,
                    refractory: false,
                    spiked: false,
                })
                .collect(),
            spikes: vec![],
            stims: vec![],
        }
    }

    #[test]
    fn all_builtin_experiments_step() {
        for (name, _) in builtin_experiments() {
            let mut exp = experiment_by_name(name).unwrap_or_else(|| panic!("missing {name}"));
            let step = exp.step(&fake_report(4.0));
            assert_eq!(step.experiment, name);
        }
    }

    #[test]
    fn pong_accumulates_score() {
        let mut pong = PongExperiment::new();
        for _ in 0..10 {
            pong.step(&fake_report(4.0));
        }
        assert!(pong.trials() > 0);
    }

    #[test]
    fn unknown_name_is_none() {
        assert!(experiment_by_name("does-not-exist").is_none());
    }
}
