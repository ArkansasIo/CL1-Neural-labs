import React, { useRef, useEffect, useState } from 'react';
import {
  Gamepad2,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Activity,
  Zap,
  Flame,
  Brain,
  Info,
} from 'lucide-react';
import { NeuralCultureSimulator } from '../simulation/neuralCulture';
import { DishBrainPongExperiment } from '../simulation/pongExperiment';
import { ClosedLoopPongState } from '../types/cl1';

interface DishBrainPongProps {
  simulator: NeuralCultureSimulator;
}

export const DishBrainPong: React.FC<DishBrainPongProps> = ({ simulator }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const experimentRef = useRef<DishBrainPongExperiment | null>(null);

  const [gameState, setGameState] = useState<ClosedLoopPongState | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);

  // Initialize experiment
  useEffect(() => {
    const experiment = new DishBrainPongExperiment(simulator);
    experimentRef.current = experiment;
    experiment.setRunning(true);
    setGameState(experiment.getState());

    return () => {
      experiment.setRunning(false);
    };
  }, [simulator]);

  // Game loop & canvas rendering
  useEffect(() => {
    let animId: number;

    const loop = (time: number) => {
      const exp = experimentRef.current;
      if (exp) {
        const state = exp.step(time);
        setGameState(state);

        // Render to canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            renderCourt(ctx, state, canvas.width, canvas.height);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const renderCourt = (
    ctx: CanvasRenderingContext2D,
    state: ClosedLoopPongState,
    w: number,
    h: number
  ) => {
    // 1. Dark court background
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, w, h);

    // Grid markings
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center dividing line
    ctx.strokeStyle = '#1e293b';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Sensory Feedback Zones (Top: Channel 10, Bottom: Channel 18)
    const upperActive = state.ballY < h * 0.45;
    const lowerActive = state.ballY > h * 0.55;

    // Upper Sensory Indicator
    ctx.fillStyle = upperActive ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0, 229, 255, 0.03)';
    ctx.fillRect(0, 0, w, h * 0.45);
    ctx.fillStyle = upperActive ? '#00e5ff' : '#0369a1';
    ctx.font = '10px monospace';
    ctx.fillText('▲ SENSORY CH#10 (UPPER)', 12, 18);

    // Lower Sensory Indicator
    ctx.fillStyle = lowerActive ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0, 229, 255, 0.03)';
    ctx.fillRect(0, h * 0.55, w, h * 0.45);
    ctx.fillStyle = lowerActive ? '#00e5ff' : '#0369a1';
    ctx.fillText('▼ SENSORY CH#18 (LOWER)', 12, h - 10);

    // 3. Biological Paddle (Controlled by Motor Channels 34 & 42)
    const paddleLeft = 24;
    const paddleWidth = 10;
    const paddleTop = state.paddleY;
    const paddleHeight = state.paddleHeight;

    // Paddle glow
    ctx.shadowColor = '#48ff00';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#48ff00';
    ctx.fillRect(paddleLeft, paddleTop, paddleWidth, paddleHeight);
    ctx.shadowBlur = 0;

    // Paddle label
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px monospace';
    ctx.save();
    ctx.translate(paddleLeft - 6, paddleTop + paddleHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('BNN PADDLE', 0, 0);
    ctx.restore();

    // 4. Pong Ball
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(state.ballX, state.ballY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball motion trail
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.arc(state.ballX - state.velocityX * 1.5, state.ballY - state.velocityY * 1.5, 4, 0, Math.PI * 2);
    ctx.fill();

    // 5. Reinforcement Feedback Flash
    if (state.lastFeedbackType === 'hit') {
      ctx.strokeStyle = 'rgba(72, 255, 0, 0.6)';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    } else if (state.lastFeedbackType === 'miss') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    }
  }

  const handleTogglePlay = () => {
    if (!experimentRef.current) return;
    const next = !isPlaying;
    experimentRef.current.setRunning(next);
    setIsPlaying(next);
  };

  const handleResetGame = () => {
    if (!experimentRef.current) return;
    experimentRef.current.resetGame();
    setGameState(experimentRef.current.getState());
  };

  const totalShots = (gameState?.hits || 0) + (gameState?.misses || 0);
  const hitRate = totalShots > 0 ? (((gameState?.hits || 0) / totalShots) * 100).toFixed(1) : '0.0';

  return (
    <div className="h-full overflow-y-auto bg-[#080c14] text-slate-100 p-4 select-none">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold tracking-wide">DishBrain Closed-Loop Biological Pong</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                Active Inference / FEP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Living human/mouse biological neurons in vitro learning to play Pong via electrical stimulation and electrophysiological motor decoding.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause Game' : 'Resume Game'}</span>
            </button>

            <button
              onClick={handleResetGame}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
              title="Reset Match"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Current Rally</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-cyan-400">{gameState?.currentRally || 0}</span>
              <span className="text-[10px] text-slate-500">hits</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px] flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              High Score
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-amber-400">{gameState?.highScore || 0}</span>
              <span className="text-[10px] text-slate-500">record rally</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Total Hits</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-emerald-400">{gameState?.hits || 0}</span>
              <span className="text-[10px] text-slate-500">returns</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Total Misses</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-rose-400">{gameState?.misses || 0}</span>
              <span className="text-[10px] text-slate-500">lost</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Hit Accuracy</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-cyan-300">{hitRate}%</span>
              <span className="text-[10px] text-slate-500">efficacy</span>
            </div>
          </div>
        </div>

        {/* 2-Column Main Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (8 cols): Pong Court Canvas */}
          <div className="lg:col-span-8 bg-[#0b101c] p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Live Court Simulation</span>
              <span className="text-[11px] font-mono text-slate-500">
                Paddle Position decoded from Cortical Motor Electrodes
              </span>
            </div>

            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-800 shadow-inner relative bg-[#070b14]">
              <canvas
                ref={canvasRef}
                width={500}
                height={375}
                className="w-full h-full block"
              />
            </div>

            {/* Performance History Bar Chart */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Rally Length History (Recent Matches)</span>
                <span className="font-mono text-slate-500">Higher bars indicate learning</span>
              </div>
              <div className="h-10 bg-slate-950 rounded flex items-end gap-1 p-1 border border-slate-900">
                {(gameState?.rallyHistory || []).map((r, i) => (
                  <div
                    key={i}
                    style={{ height: `${Math.min(100, Math.max(12, (r / 15) * 100))}%` }}
                    className="flex-1 bg-gradient-to-t from-cyan-600 to-emerald-400 rounded-t-sm"
                    title={`Game ${i + 1}: ${r} hits`}
                  />
                ))}
                {(gameState?.rallyHistory || []).length === 0 && (
                  <span className="text-[10px] text-slate-600 italic m-auto">Waiting for completed matches...</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Bio-Interface Explainer & Channels */}
          <div className="lg:col-span-4 space-y-3">
            {/* Sensory-Motor Mapping Card */}
            <div className="bg-[#0b101c] p-4 rounded-xl border border-slate-800/80 space-y-3 text-xs">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-cyan-400" />
                Closed-Loop Bio-Interface
              </h3>

              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-cyan-300">1. Sensory In (Stimulation)</span>
                    <span className="text-[10px] font-mono text-slate-400">Channels 10 & 18</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Ball Y position is encoded as biphasic pulses: upper half triggers Channel #10; lower half triggers Channel #18.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-emerald-300">2. Motor Out (Readout)</span>
                    <span className="text-[10px] font-mono text-slate-400">Channels 34 & 42</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Paddle velocity is driven by spike rate differential between Motor UP (Ch #34) and Motor DOWN (Ch #42).
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-amber-300">3. Active Inference / FEP</span>
                    <span className="text-[10px] font-mono text-slate-400">Reinforcement</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>HIT:</strong> Predictable 4Hz structured pulse (biological reward).<br />
                    <strong>MISS:</strong> Unpredictable 100Hz chaotic noise (FEP punishment).
                  </p>
                </div>
              </div>
            </div>

            {/* Scientific Citation */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 text-[11px] text-slate-400 space-y-1.5">
              <span className="font-semibold text-slate-300 block">Cortical Labs Whitepaper & Science:</span>
              <p className="leading-relaxed text-slate-400">
                Kagan et al., <em>Neuron</em> (2022): "In vitro neurons learn and exhibit sentience when embodied in a simulated game-world."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
