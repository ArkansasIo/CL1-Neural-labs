//! Safety policies and the stimulation safety gate.
//!
//! These limits are software guard-rails only. Physical experimentation
//! additionally requires institutionally validated limits and an independent
//! safety review, per the project's research-integrity policy.

use serde::{Deserialize, Serialize};

/// Hard limits applied to every stimulation before it reaches an adapter.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SafetyPolicy {
    /// Maximum stimulation amplitude in microvolts-equivalent drive units.
    pub max_amplitude_uv: f64,
    /// Maximum single-pulse duration in milliseconds.
    pub max_duration_ms: f64,
    /// Maximum number of channels addressable in one pulse.
    pub max_channels_per_pulse: usize,
    /// Maximum stimulations per second accepted by the gate.
    pub max_stims_per_second: f64,
    /// Channels that must never be stimulated (e.g. reference/ground wires).
    pub forbidden_channels: Vec<usize>,
}

impl Default for SafetyPolicy {
    fn default() -> Self {
        // Conservative defaults for a 64-channel MEA research setup.
        Self {
            max_amplitude_uv: 1_000.0,
            max_duration_ms: 2.0,
            max_channels_per_pulse: 8,
            max_stims_per_second: 50.0,
            forbidden_channels: Vec::new(),
        }
    }
}

impl SafetyPolicy {
    /// Validate the policy itself (e.g. before attaching hardware).
    pub fn validate(&self) -> Result<(), String> {
        if self.max_amplitude_uv <= 0.0 {
            return Err("max_amplitude_uv must be positive".into());
        }
        if self.max_duration_ms <= 0.0 {
            return Err("max_duration_ms must be positive".into());
        }
        if self.max_channels_per_pulse == 0 {
            return Err("max_channels_per_pulse must be at least 1".into());
        }
        if self.max_stims_per_second <= 0.0 {
            return Err("max_stims_per_second must be positive".into());
        }
        Ok(())
    }
}

/// Outcome of a safety check.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SafetyVerdict {
    Allowed,
    Rejected(String),
}

/// Rate-limited, policy-enforcing gate in front of any hardware adapter.
#[derive(Debug)]
pub struct SafetyGate {
    policy: SafetyPolicy,
    recent: Vec<std::time::Instant>,
}

impl SafetyGate {
    pub fn new(policy: SafetyPolicy) -> Result<Self, String> {
        policy.validate()?;
        Ok(Self {
            policy,
            recent: Vec::new(),
        })
    }

    pub fn policy(&self) -> &SafetyPolicy {
        &self.policy
    }

    /// Check a stimulation against the policy. Fails closed.
    pub fn check(&mut self, channels: &[usize], amplitude_uv: f64, duration_ms: f64) -> SafetyVerdict {
        let now = std::time::Instant::now();

        // Rate limit.
        self.recent.retain(|t| now.duration_since(*t).as_secs_f64() < 1.0);
        if self.recent.len() as f64 >= self.policy.max_stims_per_second {
            return SafetyVerdict::Rejected("stimulation rate limit exceeded".into());
        }

        if amplitude_uv > self.policy.max_amplitude_uv {
            return SafetyVerdict::Rejected(format!(
                "amplitude {} uV exceeds policy maximum {} uV",
                amplitude_uv, self.policy.max_amplitude_uv
            ));
        }
        if duration_ms > self.policy.max_duration_ms {
            return SafetyVerdict::Rejected(format!(
                "duration {} ms exceeds policy maximum {} ms",
                duration_ms, self.policy.max_duration_ms
            ));
        }
        if channels.len() > self.policy.max_channels_per_pulse {
            return SafetyVerdict::Rejected(format!(
                "{} channels exceed per-pulse maximum {}",
                channels.len(),
                self.policy.max_channels_per_pulse
            ));
        }
        for &ch in channels {
            if self.policy.forbidden_channels.contains(&ch) {
                return SafetyVerdict::Rejected(format!("channel {ch} is forbidden by policy"));
            }
        }

        self.recent.push(now);
        SafetyVerdict::Allowed
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_over_limit_amplitude() {
        let mut gate = SafetyGate::new(SafetyPolicy::default()).unwrap();
        assert!(matches!(
            gate.check(&[0], 5_000.0, 1.0),
            SafetyVerdict::Rejected(_)
        ));
    }

    #[test]
    fn rejects_forbidden_channel() {
        let mut gate = SafetyGate::new(SafetyPolicy {
            forbidden_channels: vec![7],
            ..Default::default()
        })
        .unwrap();
        assert!(matches!(
            gate.check(&[7], 100.0, 1.0),
            SafetyVerdict::Rejected(_)
        ));
        assert_eq!(gate.check(&[1, 2], 100.0, 1.0), SafetyVerdict::Allowed);
    }

    #[test]
    fn enforces_rate_limit() {
        let mut gate = SafetyGate::new(SafetyPolicy {
            max_stims_per_second: 2.0,
            ..Default::default()
        })
        .unwrap();
        assert_eq!(gate.check(&[0], 10.0, 1.0), SafetyVerdict::Allowed);
        assert_eq!(gate.check(&[0], 10.0, 1.0), SafetyVerdict::Allowed);
        assert!(matches!(
            gate.check(&[0], 10.0, 1.0),
            SafetyVerdict::Rejected(_)
        ));
    }
}
