//! Neural Diagnostic System — synthetic diagnostic sensor modules.
//!
//! Models the diagnostic modalities used in human neurology as *software
//! simulations* over the synthetic brain model. All outputs are synthetic;
//! they are not medical measurements and must not be used for diagnosis.

use serde::{Deserialize, Serialize};

/// A synthetic clinical diagnosis hypothesis produced by the engine.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Diagnosis {
    pub modality: String,
    pub finding: String,
    pub confidence: f64,
    pub severity: Severity,
    pub note: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Severity {
    Normal,
    Mild,
    Moderate,
    Severe,
}

// ---------------------------------------------------------------------------
// EEG — brain electrical activity
// ---------------------------------------------------------------------------

/// Canonical EEG frequency bands.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EegBands {
    pub delta_hz: (f64, f64),   // 0.5–4
    pub theta_hz: (f64, f64),   // 4–8
    pub alpha_hz: (f64, f64),   // 8–13
    pub beta_hz: (f64, f64),    // 13–30
    pub gamma_hz: (f64, f64),   // 30–100
}

impl Default for EegBands {
    fn default() -> Self {
        Self {
            delta_hz: (0.5, 4.0),
            theta_hz: (4.0, 8.0),
            alpha_hz: (8.0, 13.0),
            beta_hz: (13.0, 30.0),
            gamma_hz: (30.0, 100.0),
        }
    }
}

/// Synthetic EEG channel state: relative power per band + event flags.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EegChannel {
    pub channel: usize,
    pub delta_power: f64,
    pub theta_power: f64,
    pub alpha_power: f64,
    pub beta_power: f64,
    pub gamma_power: f64,
    /// Epileptiform spike detected in this window (simulated).
    pub epileptiform_spike: bool,
    /// Simulated seizure state for this channel.
    pub seizure_active: bool,
}

/// EEG simulator over the synthetic brain.
#[derive(Debug)]
pub struct EegModule {
    pub bands: EegBands,
    pub channels: Vec<EegChannel>,
    pub seizure_channels: Vec<usize>,
    pub tick: u64,
}

impl EegModule {
    pub fn new(channel_count: usize) -> Self {
        Self {
            bands: EegBands::default(),
            channels: (0..channel_count)
                .map(|channel| EegChannel {
                    channel,
                    delta_power: 0.2,
                    theta_power: 0.2,
                    alpha_power: 0.3,
                    beta_power: 0.2,
                    gamma_power: 0.1,
                    epileptiform_spike: false,
                    seizure_active: false,
                })
                .collect(),
            seizure_channels: Vec::new(),
            tick: 0,
        }
    }

    /// Simulate one EEG epoch (1 second).
    pub fn step(&mut self, rng: &mut impl rand::Rng) -> Vec<Diagnosis> {
        self.tick += 1;
        let mut findings = Vec::new();
        for ch in &mut self.channels {
            // Random-walk band powers, normalized approximately to 1.
            ch.delta_power = (ch.delta_power + rng.gen_range(-0.05..0.05)).clamp(0.05, 0.6);
            ch.theta_power = (ch.theta_power + rng.gen_range(-0.05..0.05)).clamp(0.05, 0.6);
            ch.alpha_power = (ch.alpha_power + rng.gen_range(-0.05..0.05)).clamp(0.05, 0.6);
            ch.beta_power = (ch.beta_power + rng.gen_range(-0.05..0.05)).clamp(0.05, 0.6);
            ch.gamma_power = (ch.gamma_power + rng.gen_range(-0.03..0.03)).clamp(0.02, 0.4);

            ch.epileptiform_spike = rng.gen_bool(0.01);
            ch.seizure_active = self.seizure_channels.contains(&ch.channel);

            if ch.epileptiform_spike {
                findings.push(Diagnosis {
                    modality: "eeg".into(),
                    finding: "epileptiform spike (simulated)".into(),
                    confidence: 0.6,
                    severity: Severity::Mild,
                    note: format!("channel {}", ch.channel),
                });
            }
            if ch.seizure_active {
                findings.push(Diagnosis {
                    modality: "eeg".into(),
                    finding: "ictal pattern (simulated seizure)".into(),
                    confidence: 0.9,
                    severity: Severity::Severe,
                    note: format!("channel {}", ch.channel),
                });
            }
        }
        findings
    }

    /// Start a simulated seizure on the given channels.
    pub fn induce_seizure(&mut self, channels: &[usize]) {
        for &c in channels {
            if !self.seizure_channels.contains(&c) {
                self.seizure_channels.push(c);
            }
        }
    }

    pub fn stop_seizure(&mut self) {
        self.seizure_channels.clear();
    }
}

// ---------------------------------------------------------------------------
// ECG/EKG — heart rhythm (not brain electrical; modelled for brain–heart
// interaction such as syncope/stroke risk context)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EcgReading {
    pub bpm: f64,
    pub rhythm: String, // "sinus", "afib", "bradycardia", "tachycardia"
    pub hrv_ms: f64,
}

#[derive(Debug)]
pub struct EcgModule {
    pub bpm: f64,
    pub hrv_ms: f64,
    pub tick: u64,
}

impl Default for EcgModule {
    fn default() -> Self {
        Self { bpm: 72.0, hrv_ms: 45.0, tick: 0 }
    }
}

impl EcgModule {
    pub fn step(&mut self, rng: &mut impl rand::Rng) -> Vec<Diagnosis> {
        self.tick += 1;
        self.bpm = (self.bpm + rng.gen_range(-2.0..2.0)).clamp(40.0, 180.0);
        self.hrv_ms = (self.hrv_ms + rng.gen_range(-3.0..3.0)).clamp(10.0, 120.0);
        let rhythm = if self.bpm < 50.0 {
            "bradycardia"
        } else if self.bpm > 110.0 {
            "tachycardia"
        } else if self.hrv_ms < 15.0 {
            "afib (simulated, low HRV)"
        } else {
            "sinus"
        };
        let severity = match rhythm {
            "sinus" => Severity::Normal,
            "bradycardia" | "tachycardia" => Severity::Mild,
            _ => Severity::Moderate,
        };
        vec![Diagnosis {
            modality: "ecg".into(),
            finding: format!("rhythm: {rhythm}"),
            confidence: 0.7,
            severity,
            note: format!("bpm {:.0}, hrv {:.0} ms", self.bpm, self.hrv_ms),
        }]
    }
}

// ---------------------------------------------------------------------------
// EMG/NCS — peripheral nerve & muscle electrical function
// ---------------------------------------------------------------------------

#[derive(Debug)]
pub struct EmgModule {
    pub motor_units: usize,
    pub recruitment_score: f64, // 0..1
    pub conduction_velocity_ms: f64,
    pub tick: u64,
}

impl Default for EmgModule {
    fn default() -> Self {
        Self { motor_units: 40, recruitment_score: 0.9, conduction_velocity_ms: 52.0, tick: 0 }
    }
}

impl EmgModule {
    pub fn step(&mut self, rng: &mut impl rand::Rng) -> Vec<Diagnosis> {
        self.tick += 1;
        self.recruitment_score = (self.recruitment_score + rng.gen_range(-0.02..0.02)).clamp(0.2, 1.0);
        self.conduction_velocity_ms = (self.conduction_velocity_ms + rng.gen_range(-1.0..1.0)).clamp(30.0, 70.0);
        let severity = if self.conduction_velocity_ms < 40.0 {
            Severity::Moderate
        } else if self.conduction_velocity_ms < 45.0 {
            Severity::Mild
        } else {
            Severity::Normal
        };
        vec![Diagnosis {
            modality: "emg".into(),
            finding: format!("motor recruitment {:.2}, CV {:.1} m/s", self.recruitment_score, self.conduction_velocity_ms),
            confidence: 0.65,
            severity,
            note: "synthetic EMG/NCS simulation".into(),
        }]
    }
}

// ---------------------------------------------------------------------------
// Structural & metabolic imaging models (MRI / CT / fMRI / MRA / PET / SPECT)
// ---------------------------------------------------------------------------

/// Simulated structural scan result.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImagingFinding {
    pub modality: String,
    pub region: String,
    pub lesion_volume_mm3: f64,
    pub anomaly: Option<String>, // e.g. "white matter hyperintensity"
    pub severity: Severity,
}

/// A synthetic 3D brain region model (lobe-level anatomy).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrainRegion {
    pub name: String,          // frontal, parietal, temporal, occipital, cerebellum, brainstem
    pub gray_matter_ml: f64,
    pub white_matter_ml: f64,
    pub perfusion_ml_100g_min: f64, // for fMRI/PET/SPECT
    pub metabolism_pct: f64,        // for PET
    pub lesion_mm3: f64,
    pub bleeding_mm3: f64,          // for CT (trauma/haemorrhage)
}

impl BrainRegion {
    pub fn healthy(name: &str) -> Self {
        Self {
            name: name.into(),
            gray_matter_ml: 120.0,
            white_matter_ml: 80.0,
            perfusion_ml_100g_min: 55.0,
            metabolism_pct: 100.0,
            lesion_mm3: 0.0,
            bleeding_mm3: 0.0,
        }
    }
}

/// MRI/CT/fMRI/MRA/PET/SPECT simulator over a region-based brain model.
#[derive(Debug)]
pub struct ImagingModule {
    pub regions: Vec<BrainRegion>,
    pub tick: u64,
}

impl Default for ImagingModule {
    fn default() -> Self {
        Self {
            regions: [
                "frontal", "parietal", "temporal", "occipital", "cerebellum", "brainstem",
            ]
            .iter()
            .map(|n| BrainRegion::healthy(n))
            .collect(),
            tick: 0,
        }
    }
}

impl ImagingModule {
    /// Inject a synthetic pathology (lesion/bleeding/hypoperfusion).
    pub fn inject_pathology(&mut self, region: &str, kind: PathologyKind, magnitude: f64) {
        if let Some(r) = self.regions.iter_mut().find(|r| r.name == region) {
            match kind {
                PathologyKind::Lesion => r.lesion_mm3 += magnitude,
                PathologyKind::Bleeding => r.bleeding_mm3 += magnitude,
                PathologyKind::Hypoperfusion => r.perfusion_ml_100g_min -= magnitude,
                PathologyKind::Hypometabolism => r.metabolism_pct -= magnitude,
            }
        }
    }

    pub fn scan(&mut self, modality: &str) -> Vec<ImagingFinding> {
        self.tick += 1;
        self.regions
            .iter()
            .filter_map(|r| {
                let anomaly = match modality {
                    "mri" if r.lesion_mm3 > 50.0 => Some("white matter hyperintensity / lesion".to_string()),
                    "ct" if r.bleeding_mm3 > 20.0 => Some("acute haemorrhage".to_string()),
                    "fmri" if r.perfusion_ml_100g_min < 40.0 => Some("reduced activation/BOLD response".to_string()),
                    "mra" if r.perfusion_ml_100g_min < 35.0 => Some("vascular narrowing (simulated stenosis)".to_string()),
                    "pet" if r.metabolism_pct < 80.0 => Some("hypometabolism".to_string()),
                    "spect" if r.perfusion_ml_100g_min < 45.0 => Some("regional hypoperfusion".to_string()),
                    _ => None,
                }?;
                let volume = match modality {
                    "mri" => r.lesion_mm3,
                    "ct" => r.bleeding_mm3,
                    _ => 0.0,
                };
                let severity = if volume > 200.0 || r.perfusion_ml_100g_min < 30.0 {
                    Severity::Severe
                } else if volume > 100.0 {
                    Severity::Moderate
                } else {
                    Severity::Mild
                };
                Some(ImagingFinding {
                    modality: modality.into(),
                    region: r.name.clone(),
                    lesion_volume_mm3: volume,
                    anomaly: Some(anomaly),
                    severity,
                })
            })
            .collect()
    }
}

#[derive(Debug, Clone, Copy)]
pub enum PathologyKind {
    Lesion,
    Bleeding,
    Hypoperfusion,
    Hypometabolism,
}

// ---------------------------------------------------------------------------
// Diagnostic engine — aggregates all modules
// ---------------------------------------------------------------------------

/// Aggregated diagnostic engine over all synthetic modalities.
#[derive(Debug)]
pub struct DiagnosticEngine {
    pub eeg: EegModule,
    pub ecg: EcgModule,
    pub emg: EmgModule,
    pub imaging: ImagingModule,
    pub tick: u64,
}

impl DiagnosticEngine {
    pub fn new(channel_count: usize) -> Self {
        Self {
            eeg: EegModule::new(channel_count),
            ecg: EcgModule::default(),
            emg: EmgModule::default(),
            imaging: ImagingModule::default(),
            tick: 0,
        }
    }

    /// Run one full diagnostic cycle; returns all findings.
    pub fn step(&mut self, rng: &mut impl rand::Rng) -> Vec<Diagnosis> {
        self.tick += 1;
        let mut out = Vec::new();
        out.extend(self.eeg.step(rng));
        out.extend(self.ecg.step(rng));
        out.extend(self.emg.step(rng));
        out
    }

    /// Run an imaging scan of a given modality.
    pub fn scan_imaging(&mut self, modality: &str) -> Vec<ImagingFinding> {
        self.imaging.scan(modality)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::thread_rng;

    #[test]
    fn eeg_generates_findings_and_seizures() {
        let mut eeg = EegModule::new(8);
        eeg.induce_seizure(&[0]);
        let mut rng = thread_rng();
        let findings = eeg.step(&mut rng);
        assert!(findings.iter().any(|f| f.severity == Severity::Severe));
        eeg.stop_seizure();
    }

    #[test]
    fn ecg_classifies_rhythm() {
        let mut ecg = EcgModule::default();
        let mut rng = thread_rng();
        for _ in 0..10 {
            let d = ecg.step(&mut rng);
            assert_eq!(d.len(), 1);
        }
    }

    #[test]
    fn imaging_detects_injected_pathology() {
        let mut im = ImagingModule::default();
        im.inject_pathology("frontal", PathologyKind::Lesion, 300.0);
        let findings = im.scan("mri");
        assert!(findings.iter().any(|f| f.region == "frontal" && f.severity == Severity::Severe));
        // Other modalities don't see a lesion
        assert!(im.scan("ct").is_empty());
    }
}
