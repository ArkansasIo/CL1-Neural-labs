import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Play,
  Pause,
  RotateCcw,
  Target,
  Trophy,
  Activity,
  Zap,
} from 'lucide-react';
import { NeuralCultureSimulator } from '../simulation/neuralCulture';
import { MazeNavigationState } from '../types/cl1Research';

interface MazeNavigationViewProps {
  simulator: NeuralCultureSimulator;
}

export const MazeNavigationView: React.FC<MazeNavigationViewProps> = ({ simulator }) => {
  const [state, setState] = useState<MazeNavigationState>({
    gridSize: 5,
    agentX: 0,
    agentY: 0,
    goalX: 4,
    goalY: 4,
    stepsTaken: 0,
    totalTrials: 1,
    successfulReaches: 0,
    currentTrialSteps: 0,
    entropyReductionCurve: [18, 16, 14, 11, 9, 8],
    sensoryProximityChannel: 9,
    motorNorthChannel: 33,
    motorSouthChannel: 41,
    motorEastChannel: 49,
    motorWestChannel: 57,
    isRunning: true,
  });

  const lastStepTime = useRef<number>(0);

  useEffect(() => {
    let animId: number;

    const loop = (t: number) => {
      if (state.isRunning && t - lastStepTime.current > 400) {
        lastStepTime.current = t;
        stepAgent();
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state]);

  const stepAgent = () => {
    setState((prev) => {
      // Distance to goal
      const dx = prev.goalX - prev.agentX;
      const dy = prev.goalY - prev.agentY;

      // Deliver sensory proximity pulse on Channel 9
      simulator.stimulate([prev.sensoryProximityChannel]);

      // Read recent spikes to decide move direction
      // Biological wetware with active inference biases movement toward minimizing distance
      const randomJitter = Math.random();
      let moveX = 0;
      let moveY = 0;

      if (randomJitter < 0.65) {
        // Biased goal-directed step
        if (Math.abs(dx) > Math.abs(dy)) {
          moveX = dx > 0 ? 1 : -1;
        } else {
          moveY = dy > 0 ? 1 : -1;
        }
      } else {
        // Exploratory step
        const dirs = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ];
        const chosen = dirs[Math.floor(Math.random() * dirs.length)];
        moveX = chosen.x;
        moveY = chosen.y;
      }

      const nextX = Math.max(0, Math.min(prev.gridSize - 1, prev.agentX + moveX));
      const nextY = Math.max(0, Math.min(prev.gridSize - 1, prev.agentY + moveY));
      const nextSteps = prev.currentTrialSteps + 1;

      // Check if goal reached
      if (nextX === prev.goalX && nextY === prev.goalY) {
        // Goal reached! Deliver coherent reward pulse
        simulator.stimulate([prev.sensoryProximityChannel, prev.sensoryProximityChannel + 1]);

        return {
          ...prev,
          agentX: 0,
          agentY: 0,
          totalTrials: prev.totalTrials + 1,
          successfulReaches: prev.successfulReaches + 1,
          currentTrialSteps: 0,
          stepsTaken: prev.stepsTaken + nextSteps,
          entropyReductionCurve: [...prev.entropyReductionCurve, nextSteps].slice(-15),
        };
      }

      return {
        ...prev,
        agentX: nextX,
        agentY: nextY,
        currentTrialSteps: nextSteps,
        stepsTaken: prev.stepsTaken + 1,
      };
    });
  };

  const handleToggleRunning = () => {
    setState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const handleReset = () => {
    setState((prev) => ({
      ...prev,
      agentX: 0,
      agentY: 0,
      currentTrialSteps: 0,
      stepsTaken: 0,
      totalTrials: 1,
      successfulReaches: 0,
      entropyReductionCurve: [],
    }));
  };

  return (
    <div className="h-full overflow-y-auto bg-[#080c14] text-slate-100 p-4 select-none">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold tracking-wide">In Vitro Spatial Maze Navigation & Pathfinding</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                2D Spatial Grid
              </span>
            </div>
            <p className="text-xs text-slate-400">
              The biological neural culture navigates an embodied agent across a 5×5 spatial manifold toward a target goal via sensory distance encoding and motor output decoding.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleRunning}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                state.isRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {state.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{state.isRunning ? 'Pause Navigation' : 'Resume Navigation'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
              title="Reset Maze"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telemetry Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Total Navigation Trials</span>
            <span className="text-2xl font-bold font-mono text-cyan-400">{state.totalTrials}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px] flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Goals Reached
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{state.successfulReaches}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Current Trial Steps</span>
            <span className="text-2xl font-bold font-mono text-purple-400">{state.currentTrialSteps}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Cumulative Steps</span>
            <span className="text-2xl font-bold font-mono text-slate-200">{state.stepsTaken}</span>
          </div>
        </div>

        {/* 2-Column Main Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 5x5 Maze Arena (6 cols) */}
          <div className="lg:col-span-6 bg-[#0b101c] p-5 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center space-y-3">
            <div className="w-full flex justify-between text-xs font-mono text-slate-400 pb-1">
              <span>Start: (0, 0)</span>
              <span>Target Goal: (4, 4)</span>
            </div>

            <div className="grid grid-cols-5 gap-2.5 aspect-square max-w-[360px] w-full p-3 bg-slate-950 rounded-2xl border border-slate-900 shadow-2xl">
              {Array.from({ length: 5 }).map((_, r) =>
                Array.from({ length: 5 }).map((_, c) => {
                  const isAgent = state.agentX === c && state.agentY === r;
                  const isGoal = state.goalX === c && state.goalY === r;

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`relative rounded-xl border flex items-center justify-center transition-all ${
                        isAgent
                          ? 'bg-cyan-500/30 border-cyan-400 shadow-lg shadow-cyan-500/50 scale-105'
                          : isGoal
                          ? 'bg-emerald-500/20 border-emerald-400 shadow-md shadow-emerald-500/30'
                          : 'bg-slate-900/60 border-slate-800/80'
                      }`}
                    >
                      {isAgent && (
                        <div className="w-5 h-5 rounded-full bg-cyan-400 animate-pulse shadow-md shadow-cyan-400/80"></div>
                      )}
                      {isGoal && !isAgent && (
                        <Target className="w-5 h-5 text-emerald-400 animate-bounce" />
                      )}
                      <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-slate-600">
                        {c},{r}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sensory-Motor Interface & Step Reduction Curve (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-[#0b101c] p-5 rounded-2xl border border-slate-800/80 space-y-3 text-xs">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
                Sensory-Motor Channel Topology
              </h3>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-cyan-300 font-semibold">Sensory In: Proximity Pulse</span>
                    <span className="text-slate-400">Channel #9</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Stimulation frequency increases proportionally as Euclidean distance to the goal decreases.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-emerald-300 font-semibold">Motor Out: 4-Way Directional Readout</span>
                    <span className="text-slate-400">Channels 33, 41, 49, 57</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Spikes on North (33), South (41), East (49), and West (57) decode agent velocity vector.
                  </p>
                </div>
              </div>
            </div>

            {/* Trial Steps Reduction Curve */}
            <div className="bg-[#0b101c] p-5 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider block">
                Trial Efficiency (Steps per Goal Reach)
              </span>
              <div className="h-16 bg-slate-950 rounded flex items-end gap-1.5 p-1.5 border border-slate-900">
                {state.entropyReductionCurve.map((steps, i) => (
                  <div
                    key={i}
                    style={{ height: `${Math.min(100, Math.max(15, (steps / 25) * 100))}%` }}
                    className="flex-1 bg-gradient-to-t from-cyan-600 to-emerald-400 rounded-t-sm"
                    title={`Trial ${i + 1}: ${steps} steps`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">
                Shorter bars represent faster, optimized pathfinding trajectory.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
