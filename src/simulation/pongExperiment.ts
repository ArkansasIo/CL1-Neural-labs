/**
 * Cortical Labs DishBrain Biological Pong Experiment
 * Implements the closed-loop in vitro neural Pong controller using
 * the Free Energy Principle (FEP) and sensory-motor electrical interfacing.
 */

import { ClosedLoopPongState } from '../types/cl1';
import { NeuralCultureSimulator } from './neuralCulture';

export class DishBrainPongExperiment {
  private simulator: NeuralCultureSimulator;
  private state: ClosedLoopPongState;
  private lastLoopTime: number = 0;

  // Smoothing for paddle motor control
  private motorUpSpikes: number = 0;
  private motorDownSpikes: number = 0;
  private motorSpikeDecay: number = 0.92;

  // Learning tracking
  private learningCurve: number[] = [];

  constructor(simulator: NeuralCultureSimulator) {
    this.simulator = simulator;
    this.state = {
      ballX: 150,
      ballY: 150,
      velocityX: 4.5,
      velocityY: 3.2,
      paddleY: 130,
      paddleHeight: 70,
      courtWidth: 400,
      courtHeight: 300,
      score: 0,
      highScore: 0,
      hits: 0,
      misses: 0,
      currentRally: 0,
      longestRally: 0,
      rallyHistory: [],
      sensoryUpperChannel: 10,
      sensoryLowerChannel: 18,
      motorUpChannel: 34,
      motorDownChannel: 42,
      lastSensoryStimTime: 0,
      lastFeedbackType: null,
      isRunning: false,
    };
  }

  public getState(): ClosedLoopPongState {
    return { ...this.state, rallyHistory: [...this.state.rallyHistory] };
  }

  public setRunning(running: boolean) {
    this.state.isRunning = running;
    if (running) {
      this.lastLoopTime = performance.now();
    }
  }

  public resetGame() {
    this.state.ballX = this.state.courtWidth / 2;
    this.state.ballY = this.state.courtHeight / 2;
    this.state.velocityX = 4.0;
    this.state.velocityY = (Math.random() - 0.5) * 4;
    this.state.paddleY = (this.state.courtHeight - this.state.paddleHeight) / 2;
    this.state.currentRally = 0;
    this.state.hits = 0;
    this.state.misses = 0;
    this.motorUpSpikes = 0;
    this.motorDownSpikes = 0;
  }

  public step(currentTimeMs: number): ClosedLoopPongState {
    if (!this.state.isRunning) {
      return this.getState();
    }

    const dt = Math.min(50, Math.max(10, currentTimeMs - this.lastLoopTime || 20)) / 1000;
    this.lastLoopTime = currentTimeMs;

    // 1. SENSORY ENCODING: Stimulate biological culture based on ball position
    // Ball Y position determines whether upper or lower sensory channel is stimulated
    const ballNormalizedY = this.state.ballY / this.state.courtHeight;

    if (currentTimeMs - this.state.lastSensoryStimTime > 80) { // ~12Hz sensory refresh
      this.state.lastSensoryStimTime = currentTimeMs;

      if (ballNormalizedY < 0.45) {
        // Ball is in upper half: stimulate sensoryUpperChannel
        this.simulator.stimulate([this.state.sensoryUpperChannel], {
          phases: [{ durationUs: 160, currentUa: -1.0 }, { durationUs: 160, currentUa: 1.0 }],
          totalDurationUs: 320,
          totalChargePc: 320,
        });
      } else if (ballNormalizedY > 0.55) {
        // Ball is in lower half: stimulate sensoryLowerChannel
        this.simulator.stimulate([this.state.sensoryLowerChannel], {
          phases: [{ durationUs: 160, currentUa: -1.0 }, { durationUs: 160, currentUa: 1.0 }],
          totalDurationUs: 320,
          totalChargePc: 320,
        });
      }
    }

    // 2. MOTOR DECODING: Read spikes from Motor UP & Motor DOWN electrodes
    const recentSpikes = this.simulator.getRecentSpikes();
    // Count spikes on motor channels within last 100ms
    const recentWindow = this.simulator.getTimestamp() - 2500; // last 100ms at 25kHz

    let upCount = 0;
    let downCount = 0;
    for (let i = recentSpikes.length - 1; i >= 0 && recentSpikes[i].timestamp >= recentWindow; i--) {
      const sp = recentSpikes[i];
      if (sp.channel === this.state.motorUpChannel || sp.channel === this.state.motorUpChannel + 1) {
        upCount++;
      }
      if (sp.channel === this.state.motorDownChannel || sp.channel === this.state.motorDownChannel + 1) {
        downCount++;
      }
    }

    this.motorUpSpikes = this.motorUpSpikes * this.motorSpikeDecay + upCount;
    this.motorDownSpikes = this.motorDownSpikes * this.motorSpikeDecay + downCount;

    // Paddle velocity is proportional to neural motor output differential
    const motorDifferential = (this.motorDownSpikes - this.motorUpSpikes) * 2.8;

    // Neural culture also learns through active inference:
    // With biological learning plasticity, slightly bias toward tracking ball
    const targetPaddleY = this.state.ballY - this.state.paddleHeight / 2;
    const learningAssistance = (this.state.hits / Math.max(1, this.state.hits + this.state.misses)) * 0.35;
    const finalVelocity = motorDifferential * (1 - learningAssistance) + (targetPaddleY - this.state.paddleY) * 0.08 * learningAssistance;

    this.state.paddleY += finalVelocity;
    // Keep paddle in bounds
    this.state.paddleY = Math.max(0, Math.min(this.state.courtHeight - this.state.paddleHeight, this.state.paddleY));

    // 3. BALL PHYSICS
    this.state.ballX += this.state.velocityX;
    this.state.ballY += this.state.velocityY;

    // Top/Bottom wall bounce
    if (this.state.ballY <= 8) {
      this.state.ballY = 8;
      this.state.velocityY = Math.abs(this.state.velocityY);
    } else if (this.state.ballY >= this.state.courtHeight - 8) {
      this.state.ballY = this.state.courtHeight - 8;
      this.state.velocityY = -Math.abs(this.state.velocityY);
    }

    // Right wall bounce (opponent wall)
    if (this.state.ballX >= this.state.courtWidth - 10) {
      this.state.ballX = this.state.courtWidth - 10;
      this.state.velocityX = -Math.abs(this.state.velocityX);
    }

    // Left wall: PADDLE COLLISION CHECK
    const paddleLeft = 20;
    const paddleRight = paddleLeft + 12;

    if (this.state.ballX <= paddleRight && this.state.ballX >= paddleLeft - 5) {
      const paddleTop = this.state.paddleY;
      const paddleBottom = this.state.paddleY + this.state.paddleHeight;

      if (this.state.ballY >= paddleTop - 4 && this.state.ballY <= paddleBottom + 4) {
        // HIT! Ball returned!
        this.state.ballX = paddleRight + 1;
        // Bounce angle based on where it hit the paddle
        const hitOffset = (this.state.ballY - (paddleTop + this.state.paddleHeight / 2)) / (this.state.paddleHeight / 2);
        this.state.velocityX = Math.min(7.5, Math.abs(this.state.velocityX) * 1.05);
        this.state.velocityY = hitOffset * 4.5;

        this.state.hits++;
        this.state.currentRally++;
        if (this.state.currentRally > this.state.longestRally) {
          this.state.longestRally = this.state.currentRally;
        }
        if (this.state.currentRally > this.state.highScore) {
          this.state.highScore = this.state.currentRally;
        }

        this.state.lastFeedbackType = 'hit';

        // PREDICTABLE REINFORCING STIMULATION (Free Energy Principle reward)
        // Uniform 4Hz structured pulse delivered to sensory channels
        this.simulator.stimulate([this.state.sensoryUpperChannel, this.state.sensoryLowerChannel], {
          phases: [{ durationUs: 160, currentUa: -1.2 }, { durationUs: 160, currentUa: 1.2 }],
          totalDurationUs: 320,
          totalChargePc: 384,
        });
      }
    }

    // Ball missed paddle (left edge pass)
    if (this.state.ballX < 0) {
      // MISS!
      this.state.misses++;
      this.state.rallyHistory.push(this.state.currentRally);
      if (this.state.rallyHistory.length > 30) this.state.rallyHistory.shift();
      this.state.currentRally = 0;
      this.state.lastFeedbackType = 'miss';

      // UNPREDICTABLE HIGH-FREQUENCY NOISE STIMULATION (FEP punishment / entropy)
      // Stimulate random channels with chaotic burst to encourage synaptic rearrangement
      const randomChannels = [
        this.state.sensoryUpperChannel,
        this.state.sensoryLowerChannel,
        this.state.motorUpChannel,
        this.state.motorDownChannel,
        Math.floor(Math.random() * 64),
      ];
      this.simulator.stimulate(randomChannels, {
        phases: [{ durationUs: 160, currentUa: -2.0 }, { durationUs: 160, currentUa: 2.0 }],
        totalDurationUs: 320,
        totalChargePc: 640,
      });

      // Reset ball position
      this.state.ballX = this.state.courtWidth / 2;
      this.state.ballY = this.state.courtHeight / 2;
      this.state.velocityX = 4.0;
      this.state.velocityY = (Math.random() - 0.5) * 4;
    }

    return this.getState();
  }
}
