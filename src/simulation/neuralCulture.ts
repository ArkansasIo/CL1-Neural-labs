/**
 * Biological Neural Network (BNN) Culture Simulator
 * Replicates Cortical Labs CL1 in vitro neuronal monolayer on an 8x8 MEA.
 */

import {
  TOTAL_CHANNELS,
  GROUNDED_CHANNELS,
  REFERENCE_CHANNELS,
  FLAG_HAS_SPIKE,
  FLAG_HAS_STIM,
  UV_PER_RAW_ADC,
  CultureParameters,
  Spike,
  Stim,
  StimDesignConfig,
  MeaAnalysisFrame,
} from '../types/cl1';
import { globalAudioSynth } from './audioSynth';

export class NeuralCultureSimulator {
  private params: CultureParameters = {
    cellType: 'Human iPSC Cortical',
    spontaneousRateHz: 4.5,
    burstProbability: 0.18,
    burstSynchrony: 0.75,
    synapticPlasticity: true,
    noiseRmsUv: 8.5,
  };

  private timestamp: number = 0;
  private isPaused: boolean = false;
  private playbackSpeed: number = 1.0;

  // 64x64 synaptic weight matrix representing functional connectivity
  private synapticWeights: Float32Array;

  // Channel states
  private channelExcitability: Float32Array;
  private channelRefractory: Int32Array;
  private channelBaselinesUv: Float32Array;
  private lastSpikeTimestamps: Int32Array;
  private lastStimTimestamps: Int32Array;

  // Rolling waveform sample ring buffers (for oscilloscope rendering)
  // Each channel keeps last 200 samples of extracellular voltage (uV)
  private waveformBuffers: Float32Array[];
  private waveformPointers: Int32Array;

  // Spike counters for rolling firing rate calculation
  private spikeWindowCounts: Int32Array;
  private lastRateUpdateTime: number = 0;
  private firingRatesHz: Float32Array;

  // Burst dynamics
  private isBursting: boolean = false;
  private burstFramesRemaining: number = 0;
  private burstIntensity: number = 0;
  private burstHistory: Array<{ time: number; durationMs: number; channelCount: number }> = [];

  // Recent events buffer for analytics & raster plots
  private recentSpikes: Spike[] = [];
  private recentStims: Stim[] = [];

  // Listeners
  private listeners: Set<(frame: MeaAnalysisFrame) => void> = new Set();

  constructor() {
    this.synapticWeights = new Float32Array(TOTAL_CHANNELS * TOTAL_CHANNELS);
    this.channelExcitability = new Float32Array(TOTAL_CHANNELS);
    this.channelRefractory = new Int32Array(TOTAL_CHANNELS);
    this.channelBaselinesUv = new Float32Array(TOTAL_CHANNELS);
    this.lastSpikeTimestamps = new Int32Array(TOTAL_CHANNELS).fill(-99999);
    this.lastStimTimestamps = new Int32Array(TOTAL_CHANNELS).fill(-99999);
    this.spikeWindowCounts = new Int32Array(TOTAL_CHANNELS);
    this.firingRatesHz = new Float32Array(TOTAL_CHANNELS);

    this.waveformBuffers = Array.from({ length: TOTAL_CHANNELS }, () => new Float32Array(200));
    this.waveformPointers = new Int32Array(TOTAL_CHANNELS);

    this.initializeNeuralNetwork();
  }

  private initializeNeuralNetwork() {
    // Generate organic clusters of neurons across the 8x8 MEA
    const clusterCenters = [
      { r: 2.5, c: 2.0, strength: 1.2 },
      { r: 4.8, c: 5.2, strength: 1.4 },
      { r: 2.0, c: 5.5, strength: 0.9 },
    ];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const ch = c * 8 + r;
        if (GROUNDED_CHANNELS.includes(ch as any)) {
          this.channelExcitability[ch] = 0;
          continue;
        }
        if (REFERENCE_CHANNELS.includes(ch as any)) {
          this.channelExcitability[ch] = 0.05;
          continue;
        }

        // Distance to nearest cluster
        let maxInfluence = 0.4;
        for (const cluster of clusterCenters) {
          const dist = Math.hypot(r - cluster.r, c - cluster.c);
          const influence = cluster.strength * Math.exp(-dist / 1.8);
          if (influence > maxInfluence) maxInfluence = influence;
        }

        // Natural biological heterogeneity
        this.channelExcitability[ch] = Math.max(0.1, Math.min(1.8, maxInfluence * (0.8 + Math.random() * 0.4)));
        this.channelBaselinesUv[ch] = (Math.random() - 0.5) * 6; // slight DC offset
      }
    }

    // Initialize distance-dependent synaptic connectivity with small-world network topology
    for (let i = 0; i < TOTAL_CHANNELS; i++) {
      const r1 = i % 8;
      const c1 = Math.floor(i / 8);
      for (let j = 0; j < TOTAL_CHANNELS; j++) {
        if (i === j) continue;
        const r2 = j % 8;
        const c2 = Math.floor(j / 8);
        const dist = Math.hypot(r1 - r2, c1 - c2);

        // Exponential decay with distance + random long-range axonal connections
        if (dist <= 3.2 && !GROUNDED_CHANNELS.includes(i as any) && !GROUNDED_CHANNELS.includes(j as any)) {
          const w = Math.exp(-dist / 1.4) * (0.15 + Math.random() * 0.2);
          this.synapticWeights[i * TOTAL_CHANNELS + j] = w;
        } else if (Math.random() < 0.04) {
          // Long-range axonal projections
          this.synapticWeights[i * TOTAL_CHANNELS + j] = 0.08 + Math.random() * 0.12;
        }
      }
    }
  }

  public step(timeStepMs: number = 20): MeaAnalysisFrame {
    if (this.isPaused) {
      return this.createEmptyFrame();
    }

    this.timestamp += Math.round(timeStepMs * 25); // 25 samples per ms at 25kHz

    const minValues = new Int16Array(TOTAL_CHANNELS);
    const maxValues = new Int16Array(TOTAL_CHANNELS);
    const flags = new Int16Array(TOTAL_CHANNELS);
    const currentSpikes: Spike[] = [];
    const currentStims: Stim[] = [];

    // Trigger spontaneous network burst with given probability
    if (!this.isBursting && Math.random() < (this.params.burstProbability * (timeStepMs / 1000))) {
      this.isBursting = true;
      this.burstFramesRemaining = Math.floor(8 + Math.random() * 16); // 160-480ms
      this.burstIntensity = 1.8 + Math.random() * 1.5;
    }

    let burstMultiplier = 1.0;
    if (this.isBursting) {
      burstMultiplier = this.burstIntensity;
      this.burstFramesRemaining--;
      if (this.burstFramesRemaining <= 0) {
        this.isBursting = false;
        this.burstHistory.push({
          time: this.timestamp,
          durationMs: 250,
          channelCount: Math.round(TOTAL_CHANNELS * this.params.burstSynchrony),
        });
        if (this.burstHistory.length > 50) this.burstHistory.shift();
      }
    }

    // Process each channel
    for (let ch = 0; ch < TOTAL_CHANNELS; ch++) {
      const isGrounded = GROUNDED_CHANNELS.includes(ch as any);
      const isRef = REFERENCE_CHANNELS.includes(ch as any);

      let rawUv = this.channelBaselinesUv[ch];

      if (isGrounded) {
        // Grounded channels only have minuscule thermal noise
        const noise = (Math.random() - 0.5) * 1.5;
        minValues[ch] = Math.round((noise - 0.5) / UV_PER_RAW_ADC);
        maxValues[ch] = Math.round((noise + 0.5) / UV_PER_RAW_ADC);
        this.pushWaveformSample(ch, noise);
        continue;
      }

      if (isRef) {
        const noise = (Math.random() - 0.5) * 3.0;
        minValues[ch] = Math.round((noise - 1) / UV_PER_RAW_ADC);
        maxValues[ch] = Math.round((noise + 1) / UV_PER_RAW_ADC);
        this.pushWaveformSample(ch, noise);
        continue;
      }

      // Check refractory period
      if (this.channelRefractory[ch] > 0) {
        this.channelRefractory[ch]--;
      }

      // Baseline extracellular fluctuations (LFP band + thermal noise)
      const noise = (Math.random() - 0.5) * this.params.noiseRmsUv * 2;
      rawUv += noise;

      // Spike probability: baseline rate * excitability * burst
      const baseProb = (this.params.spontaneousRateHz * (timeStepMs / 1000)) * this.channelExcitability[ch];
      const spikeProb = Math.min(0.9, baseProb * burstMultiplier);

      const hasSpike = this.channelRefractory[ch] <= 0 && Math.random() < spikeProb;

      // Check if stimulated in this step
      const hasStim = this.lastStimTimestamps[ch] === this.timestamp;

      if (hasSpike) {
        flags[ch] |= FLAG_HAS_SPIKE;
        this.channelRefractory[ch] = 3; // ~60ms refractory
        this.lastSpikeTimestamps[ch] = this.timestamp;
        this.spikeWindowCounts[ch]++;

        // Realistic extracellular action potential:
        // Deep negative peak (-75uV) + positive repolarization peak (+35uV)
        const spikePeakUv = -(55 + Math.random() * 45) * this.channelExcitability[ch];
        const spikeOvershootUv = (20 + Math.random() * 20);

        rawUv = spikePeakUv;

        // Generate synthetic 75-sample spike waveform for inspector
        const spikeSamples = new Float32Array(75);
        for (let s = 0; s < 75; s++) {
          if (s < 25) {
            // Pre-spike slight polarization
            spikeSamples[s] = (Math.random() - 0.5) * 6;
          } else if (s === 25) {
            spikeSamples[s] = spikePeakUv;
          } else if (s < 45) {
            // Rapid repolarization overshoot
            const t = (s - 25) / 20;
            spikeSamples[s] = spikePeakUv * (1 - t) + spikeOvershootUv * Math.sin(t * Math.PI);
          } else {
            // Gradual recovery
            const t = (s - 45) / 30;
            spikeSamples[s] = spikeOvershootUv * Math.exp(-t * 2) + (Math.random() - 0.5) * 4;
          }
        }

        const spikeObj: Spike = {
          timestamp: this.timestamp,
          channel: ch,
          channelMeanSample: this.channelBaselinesUv[ch],
          samples: spikeSamples,
        };
        currentSpikes.push(spikeObj);
        this.recentSpikes.push(spikeObj);

        // Sonify action potential (subsampled for organic laboratory sound)
        if (Math.random() < 0.25) {
          globalAudioSynth.playSpikeClick();
        }

        // Propagate synaptic excitation to neighbors
        for (let target = 0; target < TOTAL_CHANNELS; target++) {
          const w = this.synapticWeights[ch * TOTAL_CHANNELS + target];
          if (w > 0.05 && this.channelRefractory[target] <= 0) {
            // Slight boost in excitability for target
            if (Math.random() < w * 0.4) {
              this.channelRefractory[target] = 0; // prime for next tick
            }
          }
        }

        minValues[ch] = Math.round((spikePeakUv - 5) / UV_PER_RAW_ADC);
        maxValues[ch] = Math.round((spikeOvershootUv + 5) / UV_PER_RAW_ADC);
      } else {
        minValues[ch] = Math.round((rawUv - 4) / UV_PER_RAW_ADC);
        maxValues[ch] = Math.round((rawUv + 4) / UV_PER_RAW_ADC);
      }

      if (hasStim) {
        flags[ch] |= FLAG_HAS_STIM;
        // Large stimulation artifact
        minValues[ch] = Math.round(-800 / UV_PER_RAW_ADC);
        maxValues[ch] = Math.round(800 / UV_PER_RAW_ADC);
        rawUv = 600;
      }

      this.pushWaveformSample(ch, rawUv);
    }

    // Maintain recent spikes/stims window (last 500)
    if (this.recentSpikes.length > 600) {
      this.recentSpikes = this.recentSpikes.slice(-600);
    }
    if (this.recentStims.length > 200) {
      this.recentStims = this.recentStims.slice(-200);
    }

    // Rolling firing rates update every 500ms
    const now = Date.now();
    if (now - this.lastRateUpdateTime >= 500) {
      const dt = (now - this.lastRateUpdateTime) / 1000;
      for (let ch = 0; ch < TOTAL_CHANNELS; ch++) {
        this.firingRatesHz[ch] = this.spikeWindowCounts[ch] / dt;
        this.spikeWindowCounts[ch] = 0;
      }
      this.lastRateUpdateTime = now;
    }

    const frame: MeaAnalysisFrame = {
      timestamp: this.timestamp,
      minValues,
      maxValues,
      flags,
      spikes: currentSpikes,
      stims: currentStims,
    };

    // Notify listeners
    this.listeners.forEach((listener) => listener(frame));
    return frame;
  }

  private pushWaveformSample(channel: number, valueUv: number) {
    const buffer = this.waveformBuffers[channel];
    let ptr = this.waveformPointers[channel];
    buffer[ptr] = valueUv;
    this.waveformPointers[channel] = (ptr + 1) % buffer.length;
  }

  public getWaveformHistory(channel: number): Float32Array {
    const buffer = this.waveformBuffers[channel];
    const ptr = this.waveformPointers[channel];
    const result = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      result[i] = buffer[(ptr + i) % buffer.length];
    }
    return result;
  }

  public stimulate(channels: number[], design?: StimDesignConfig): Stim[] {
    const deliveredStims: Stim[] = [];
    const pulseWidth = design?.phases[0]?.durationUs ?? 160;
    const currentUa = design?.phases[0]?.currentUa ?? -1.0;

    if (channels.length > 0) {
      globalAudioSynth.playStimDischarge();
    }

    for (const ch of channels) {
      if (GROUNDED_CHANNELS.includes(ch as any) || REFERENCE_CHANNELS.includes(ch as any)) {
        continue;
      }

      this.lastStimTimestamps[ch] = this.timestamp;
      const stim: Stim = {
        timestamp: this.timestamp,
        channel: ch,
        currentUa,
        durationUs: pulseWidth,
      };
      deliveredStims.push(stim);
      this.recentStims.push(stim);

      // Evoked neuronal response:
      // Direct electrical excitation triggers immediate burst of action potentials in nearby electrodes
      const r1 = ch % 8;
      const c1 = Math.floor(ch / 8);

      for (let target = 0; target < TOTAL_CHANNELS; target++) {
        if (GROUNDED_CHANNELS.includes(target as any)) continue;
        const r2 = target % 8;
        const c2 = Math.floor(target / 8);
        const dist = Math.hypot(r1 - r2, c1 - c2);

        if (dist <= 2.5) {
          // Temporarily increase excitability (evoked response)
          this.channelExcitability[target] = Math.min(2.5, this.channelExcitability[target] + 0.35);
          this.channelRefractory[target] = 0;

          // Plasticity / STDP:
          if (this.params.synapticPlasticity && target !== ch) {
            const idx = ch * TOTAL_CHANNELS + target;
            this.synapticWeights[idx] = Math.min(1.0, this.synapticWeights[idx] + 0.05);
          }
        }
      }
    }

    return deliveredStims;
  }

  private createEmptyFrame(): MeaAnalysisFrame {
    return {
      timestamp: this.timestamp,
      minValues: new Int16Array(TOTAL_CHANNELS),
      maxValues: new Int16Array(TOTAL_CHANNELS),
      flags: new Int16Array(TOTAL_CHANNELS),
      spikes: [],
      stims: [],
    };
  }

  public onFrame(listener: (frame: MeaAnalysisFrame) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public setPlaybackSpeed(speed: number) {
    this.playbackSpeed = speed;
  }

  public getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  public getCultureParams(): CultureParameters {
    return { ...this.params };
  }

  public updateCultureParams(newParams: Partial<CultureParameters>) {
    this.params = { ...this.params, ...newParams };
  }

  public getFiringRates(): Float32Array {
    return this.firingRatesHz;
  }

  public getRecentSpikes(): Spike[] {
    return this.recentSpikes;
  }

  public getRecentStims(): Stim[] {
    return this.recentStims;
  }

  public getSynapticWeights(): Float32Array {
    return this.synapticWeights;
  }

  public getBurstHistory() {
    return this.burstHistory;
  }

  public getTimestamp(): number {
    return this.timestamp;
  }

  public resetCulture() {
    this.timestamp = 0;
    this.recentSpikes = [];
    this.recentStims = [];
    this.lastSpikeTimestamps.fill(-99999);
    this.lastStimTimestamps.fill(-99999);
    this.channelRefractory.fill(0);
    this.initializeNeuralNetwork();
  }
}
