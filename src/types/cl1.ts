/**
 * Cortical Labs CL1 Data Types & Interface Definitions
 * Matches Cortical Labs Python SDK (cl-sdk) specifications.
 */

export interface Spike {
  timestamp: number;
  channel: number;
  channelMeanSample: number;
  samples?: Float32Array | number[]; // 75 samples: 25 pre-trigger, 50 post-trigger
}

export interface Stim {
  timestamp: number;
  channel: number;
  currentUa: number;
  durationUs: number;
}

export interface StimDesignConfig {
  phases: Array<{
    durationUs: number;
    currentUa: number;
  }>;
  totalDurationUs: number;
  totalChargePc: number;
}

export interface ChannelInfo {
  id: number;
  row: number;
  col: number;
  label: string;
  isGrounded: boolean;
  isReference: boolean;
  active: boolean;
  firingRateHz: number;
  snr: number;
  baselineMeanUv: number;
  lastSpikeTime: number;
  lastStimTime: number;
}

export interface MeaAnalysisFrame {
  timestamp: number;
  // For each channel: min, max, flags (FLAG_HAS_SPIKE = 1, FLAG_HAS_STIM = 2)
  minValues: Int16Array;
  maxValues: Int16Array;
  flags: Int16Array;
  spikes: Spike[];
  stims: Stim[];
}

export interface CultureParameters {
  cellType: 'Human iPSC Cortical' | 'Mouse Embryonic Cortical' | 'Mixed Cortical/Hippocampal';
  spontaneousRateHz: number;      // 0.5 - 15 Hz
  burstProbability: number;       // 0 - 1
  burstSynchrony: number;         // 0 - 1
  synapticPlasticity: boolean;    // STDP learning
  noiseRmsUv: number;             // Extracellular noise floor ~5-15 uV
}

export interface ClosedLoopPongState {
  ballX: number;
  ballY: number;
  velocityX: number;
  velocityY: number;
  paddleY: number;
  paddleHeight: number;
  courtWidth: number;
  courtHeight: number;
  score: number;
  highScore: number;
  hits: number;
  misses: number;
  currentRally: number;
  longestRally: number;
  rallyHistory: number[];
  sensoryUpperChannel: number;
  sensoryLowerChannel: number;
  motorUpChannel: number;
  motorDownChannel: number;
  lastSensoryStimTime: number;
  lastFeedbackType: 'hit' | 'miss' | null;
  isRunning: boolean;
}

export interface RecordingSession {
  id: string;
  startTime: number;
  durationSeconds: number;
  frameCount: number;
  spikeCount: number;
  stimCount: number;
  isRecording: boolean;
  spikes: Array<{ timestamp: number; channel: number }>;
  stims: Array<{ timestamp: number; channel: number; currentUa: number }>;
  firingRates: number[];
}

export interface AnalyticsSnapshot {
  averageFiringRateHz: number;
  activeElectrodeCount: number;
  networkCriticalityBranchingRatio: number; // ~1.0 indicates critical dynamics
  burstFrequencyHz: number;
  informationEntropyBits: number;
  lempelZivComplexity: number;
  functionalConnectivityMatrix: number[][]; // 64x64 Pearson correlation
  psthBins: { timeMs: number; count: number }[];
}

export const GROUNDED_CHANNELS = [0, 7, 56, 63] as const;
export const REFERENCE_CHANNELS = [4] as const;
export const TOTAL_CHANNELS = 64;
export const SAMPLING_RATE_HZ = 25000;
export const UV_PER_RAW_ADC = 0.195;
export const FLAG_HAS_SPIKE = 1 << 0;
export const FLAG_HAS_STIM = 1 << 1;
