/**
 * Cortical Labs CL1 Wetware Research, Data Structures & System Types
 * Expanded module, sub-module, class, sub-class, array and struct specifications.
 */

// ==========================================
// 1. BIOLOGICAL & WETWARE SUB-SYSTEM TYPES
// ==========================================

export type NeuronSpecies = 'Homo sapiens (Human iPSC)' | 'Mus musculus (Mouse Embryonic)' | 'Rattus norvegicus (Rat Cortical)';
export type CultureMorphology = 'Monolayer 2D' | 'Brain Organoid 3D' | 'Assembloid Cortico-Striatal';
export type DifferentiationProtocol = 'Ngn2 Rapid Induction' | 'Dual-SMAD Directed' | 'Primary Dissociated E18';

export interface CellularSubpopulation {
  cellType: string;
  percentage: number;
  markerGene: string;
  restingMembranePotentialMv: number;
  inputResistanceMohm: number;
  actionPotentialThresholdMv: number;
}

export interface BiologicalCultureProfile {
  id: string;
  name: string;
  species: NeuronSpecies;
  morphology: CultureMorphology;
  differentiationProtocol: DifferentiationProtocol;
  daysInVitroDIV: number;
  cellDensityPerMm2: number;
  viabilityPercentage: number;
  glialRatio: number; // Astrocyte to neuron ratio (e.g. 0.25)
  synaptogenesisScore: number; // 0.0 - 1.0
  subpopulations: CellularSubpopulation[];
  perfusionMedium: string; // e.g. BrainPhys + SM1 + N2
  ph: number;
  osmolarityMosm: number;
  temperatureC: number;
  dissolvedO2Kpa: number;
}

// ==========================================
// 2. HARDWARE & MEA TRANSDUCER STRUCTURES
// ==========================================

export type ElectrodeMaterial = 'Titanium Nitride (TiN)' | 'Platinum Black' | 'PEDOT:PSS Polymer' | 'Gold Electroplated';

export interface ElectrodeGeometry {
  channelIndex: number;
  row: number;
  col: number;
  xMicrons: number;
  yMicrons: number;
  diameterMicrons: number;
  pitchMicrons: number;
  electrodeMaterial: ElectrodeMaterial;
  impedance1kHzKohms: number;
  chargeInjectionCapacityMcuCPerCm2: number;
  isGrounded: boolean;
  isReference: boolean;
  amplifierGain: number;
}

export interface EnvironmentalChamberTelemetry {
  temperatureC: number;
  targetTemperatureC: number;
  temperatureDeviationC: number;
  co2Percentage: number;
  targetCo2Percentage: number;
  relativeHumidityPercentage: number;
  perfusionFlowRateMlMin: number;
  chamberPressureMbar: number;
  lastFluidExchangeTimestamp: number;
  sterilizationCycleStatus: 'Nominal' | 'Autoclave Required' | 'Degraded';
}

// ==========================================
// 3. ELECTROPHYSIOLOGY FILTERING & DSP ARRAYS
// ==========================================

export interface DspFilterConfig {
  highpassCutoffHz: number; // default 300 Hz
  lowpassCutoffHz: number;  // default 3000 Hz
  notchFilter50Hz: boolean;
  notchFilter60Hz: boolean;
  dcOffsetCorrection: boolean;
  crosstalkBlankingUs: number; // blanking window post-stimulus (e.g. 2000 us)
  spikeDetectionThresholdMultiplier: number; // e.g. -5.0 * standard deviation
  spikeDetectionMethod: 'Negative Peak Threshold' | 'Wavelet Transform' | 'Energy Operator NEO';
  spikeAlignmentWindowSamples: { prePeak: number; postPeak: number }; // 25 pre, 50 post
}

// ==========================================
// 4. SCIENTIFIC RESEARCH & WHITEPAPER PAPERS
// ==========================================

export interface ScientificArticle {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi: string;
  arxivId?: string;
  abstract: string;
  coreKeypoints: string[];
  fepPrinciples: string[];
  hardwareArchitecture: string[];
  relevanceToCL1: string;
}

// ==========================================
// 5. ASSOCIATIVE CONDITIONING EXPERIMENT TYPES
// ==========================================

export interface ClassicalConditioningState {
  conditionedStimulusCSChannels: number[]; // e.g. Channel 12 (tone/cue)
  unconditionedStimulusUSChannels: number[]; // e.g. Channel 45 (reinforcing pulse)
  pairingDelayMs: number; // inter-stimulus interval ISI (e.g. 50 ms)
  trialCount: number;
  crResponseProbability: number; // Conditioned response probability (0.0 - 1.0)
  synapticPotentiationLTP: number; // Percentage increase in baseline connectivity (e.g. +38%)
  pairingHistory: Array<{ trial: number; responseLatMs: number; isEvoked: boolean }>;
  isRunning: boolean;
}

// ==========================================
// 6. SPATIAL MAZE NAVIGATION TYPES
// ==========================================

export interface MazeNavigationState {
  gridSize: number; // e.g. 5x5
  agentX: number;
  agentY: number;
  goalX: number;
  goalY: number;
  stepsTaken: number;
  totalTrials: number;
  successfulReaches: number;
  currentTrialSteps: number;
  entropyReductionCurve: number[];
  sensoryProximityChannel: number;
  motorNorthChannel: number;
  motorSouthChannel: number;
  motorEastChannel: number;
  motorWestChannel: number;
  isRunning: boolean;
}

// ==========================================
// 7. SYSTEM AUDIO SONIFICATION SETTINGS
// ==========================================

export interface BioAudioSettings {
  enabled: boolean;
  masterVolume: number; // 0.0 - 1.0
  activeChannelMuted: boolean[];
  crackleThresholdUv: number; // -40 uV
  stimToneVolume: number; // audio beep when stim delivered
  playbackSpeedPitchLock: boolean;
}
