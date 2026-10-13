/**
 * Classical Conditioning & Hebbian Associative Memory Experiment
 * Simulates in vitro Long-Term Potentiation (LTP) and Spike-Timing Dependent Plasticity (STDP)
 * on Cortical Labs CL1 wetware.
 */

import { NeuralCultureSimulator } from './neuralCulture';
import { ClassicalConditioningState } from '../types/cl1Research';

export class AssociativeConditioningExperiment {
  private simulator: NeuralCultureSimulator;
  private state: ClassicalConditioningState;
  private lastTrialTime: number = 0;

  constructor(simulator: NeuralCultureSimulator) {
    this.simulator = simulator;
    this.state = {
      conditionedStimulusCSChannels: [12],
      unconditionedStimulusUSChannels: [28],
      pairingDelayMs: 40,
      trialCount: 0,
      crResponseProbability: 0.12, // Baseline spontaneous co-activation
      synapticPotentiationLTP: 0.0,
      pairingHistory: [],
      isRunning: false,
    };
  }

  public getState(): ClassicalConditioningState {
    return { ...this.state, pairingHistory: [...this.state.pairingHistory] };
  }

  public setRunning(running: boolean) {
    this.state.isRunning = running;
    if (running) {
      this.lastTrialTime = performance.now();
    }
  }

  public resetExperiment() {
    this.state.trialCount = 0;
    this.state.crResponseProbability = 0.12;
    this.state.synapticPotentiationLTP = 0.0;
    this.state.pairingHistory = [];
  }

  /**
   * Run a single paired conditioning trial (CS -> delay -> US)
   */
  public triggerPairedTrial(): ClassicalConditioningState {
    this.state.trialCount++;

    // 1. Deliver CS (Conditioned Stimulus)
    this.simulator.stimulate(this.state.conditionedStimulusCSChannels, {
      phases: [{ durationUs: 160, currentUa: -1.0 }, { durationUs: 160, currentUa: 1.0 }],
      totalDurationUs: 320,
      totalChargePc: 320,
    });

    // 2. Deliver US (Unconditioned Stimulus) after pairing delay
    setTimeout(() => {
      this.simulator.stimulate(this.state.unconditionedStimulusUSChannels, {
        phases: [{ durationUs: 160, currentUa: -1.8 }, { durationUs: 160, currentUa: 1.8 }],
        totalDurationUs: 320,
        totalChargePc: 576,
      });
    }, this.state.pairingDelayMs);

    // Hebbian STDP Potentiation
    // Each successful pairing increases synaptic weight by ~2.5% up to +85%
    this.state.synapticPotentiationLTP = Math.min(85, this.state.synapticPotentiationLTP + (2.5 + Math.random() * 1.5));
    this.state.crResponseProbability = Math.min(0.92, 0.12 + (this.state.synapticPotentiationLTP / 100) * 0.8);

    const trialRecord = {
      trial: this.state.trialCount,
      responseLatMs: this.state.pairingDelayMs + (10 + Math.random() * 8),
      isEvoked: true,
    };
    this.state.pairingHistory.push(trialRecord);
    if (this.state.pairingHistory.length > 40) this.state.pairingHistory.shift();

    return this.getState();
  }

  /**
   * Test trial: Deliver CS alone to test for Conditioned Response (CR)
   */
  public triggerTestTrial(): { isCREvoked: boolean; responseLatencyMs: number } {
    this.simulator.stimulate(this.state.conditionedStimulusCSChannels, {
      phases: [{ durationUs: 160, currentUa: -1.0 }, { durationUs: 160, currentUa: 1.0 }],
      totalDurationUs: 320,
      totalChargePc: 320,
    });

    const isEvoked = Math.random() < this.state.crResponseProbability;
    const latency = isEvoked ? 14 + Math.random() * 6 : 999;

    return { isCREvoked: isEvoked, responseLatencyMs: latency };
  }

  public step(time: number): ClassicalConditioningState {
    if (!this.state.isRunning) return this.getState();

    // In auto mode, trigger paired trial every 2.5 seconds
    if (time - this.lastTrialTime >= 2500) {
      this.lastTrialTime = time;
      this.triggerPairedTrial();
    }

    return this.getState();
  }
}
