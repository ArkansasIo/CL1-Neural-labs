import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Play,
  Pause,
  RotateCcw,
  Zap,
  TrendingUp,
  Activity,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { NeuralCultureSimulator } from '../simulation/neuralCulture';
import { AssociativeConditioningExperiment } from '../simulation/conditioningExperiment';
import { ClassicalConditioningState } from '../types/cl1Research';

interface AssociativeConditioningViewProps {
  simulator: NeuralCultureSimulator;
}

export const AssociativeConditioningView: React.FC<AssociativeConditioningViewProps> = ({ simulator }) => {
  const expRef = useRef<AssociativeConditioningExperiment | null>(null);
  const [state, setState] = useState<ClassicalConditioningState | null>(null);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ isCREvoked: boolean; responseLatencyMs: number } | null>(null);

  useEffect(() => {
    const exp = new AssociativeConditioningExperiment(simulator);
    expRef.current = exp;
    setState(exp.getState());

    let animId: number;
    const loop = (t: number) => {
      if (expRef.current && isAutoRunning) {
        const nextState = expRef.current.step(t);
        setState(nextState);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      exp.setRunning(false);
    };
  }, [simulator, isAutoRunning]);

  const handleToggleAuto = () => {
    if (!expRef.current) return;
    const next = !isAutoRunning;
    expRef.current.setRunning(next);
    setIsAutoRunning(next);
  };

  const handleTriggerPairedTrial = () => {
    if (!expRef.current) return;
    const next = expRef.current.triggerPairedTrial();
    setState(next);
  };

  const handleTriggerTestTrial = () => {
    if (!expRef.current) return;
    const res = expRef.current.triggerTestTrial();
    setTestResult(res);
  };

  const handleReset = () => {
    if (!expRef.current) return;
    expRef.current.resetExperiment();
    setState(expRef.current.getState());
    setTestResult(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#080c14] text-slate-100 p-4 select-none">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold tracking-wide">In Vitro Associative Conditioning & Hebbian LTP</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                Spike-Timing-Dependent Plasticity (STDP)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Conditioning protocol: Repeatedly pair Conditioned Stimulus (CS) with Unconditioned Stimulus (US) within a 40 ms temporal window to potentiate functional synaptic pathways.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAuto}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                isAutoRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {isAutoRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isAutoRunning ? 'Pause Training' : 'Auto Train Trials'}</span>
            </button>

            <button
              onClick={handleTriggerPairedTrial}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Deliver 1 Paired Trial</span>
            </button>

            <button
              onClick={handleTriggerTestTrial}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition active:scale-[0.98]"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Test CS Alone</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
              title="Reset Plasticity"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telemetry KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Paired Trials Delivered</span>
            <span className="text-2xl font-bold font-mono text-cyan-400">{state?.trialCount || 0}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px] flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Synaptic Potentiation (LTP)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                +{state?.synapticPotentiationLTP.toFixed(1) || '0.0'}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">gain</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">CR Response Probability</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-purple-400">
                {((state?.crResponseProbability || 0) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">evoked</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">STDP Inter-Stimulus Delay</span>
            <span className="text-2xl font-bold font-mono text-amber-400">{state?.pairingDelayMs} ms</span>
          </div>
        </div>

        {/* Main Protocol Diagram & Test Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Protocol Diagram (7 cols) */}
          <div className="lg:col-span-7 bg-[#0b101c] p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
              Electrophysiological Pairing Sequence
            </h3>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center font-bold text-cyan-400">
                    CS
                  </div>
                  <div>
                    <span className="text-slate-200 block font-sans font-semibold">Conditioned Stimulus (Cue)</span>
                    <span className="text-[11px] text-slate-500">Channel #12 (160 μs, ±1.0 μA)</span>
                  </div>
                </div>

                <div className="h-0.5 w-16 bg-gradient-to-r from-cyan-500 to-purple-500 relative">
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-amber-400">
                    Δt = 40 ms
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center font-bold text-purple-400">
                    US
                  </div>
                  <div>
                    <span className="text-slate-200 block font-sans font-semibold">Unconditioned Stimulus</span>
                    <span className="text-[11px] text-slate-500">Channel #28 (160 μs, ±1.8 μA)</span>
                  </div>
                </div>
              </div>

              {/* Learning Curve Bar Chart */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] text-slate-400 block">LTP Potentiation Over Pairing Trials</span>
                <div className="h-16 bg-slate-900/60 rounded flex items-end gap-1 p-1 border border-slate-800">
                  {(state?.pairingHistory || []).map((rec, i) => (
                    <div
                      key={i}
                      style={{ height: `${Math.min(100, Math.max(15, (i / 30) * 100))}%` }}
                      className="flex-1 bg-gradient-to-t from-purple-700 to-cyan-400 rounded-t-sm"
                      title={`Trial #${rec.trial}: ${rec.responseLatMs.toFixed(1)} ms`}
                    />
                  ))}
                  {(state?.pairingHistory || []).length === 0 && (
                    <span className="text-[10px] text-slate-600 italic m-auto">
                      Click "Deliver 1 Paired Trial" or "Auto Train Trials" to begin Hebbian conditioning.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Test Trial Result & Scientific Principle (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#0b101c] p-5 rounded-2xl border border-slate-800/80 space-y-3">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
                Conditioned Response (CR) Probe
              </h3>

              {testResult ? (
                <div
                  className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                    testResult.isCREvoked
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm font-sans">
                    <CheckCircle className="w-4 h-4" />
                    <span>{testResult.isCREvoked ? 'Conditioned Response Evoked!' : 'No Conditioned Response'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {testResult.isCREvoked
                      ? `Delivering CS alone successfully triggered postsynaptic firing on Channel #28 with ${testResult.responseLatencyMs.toFixed(1)} ms latency, confirming synaptic potentiation.`
                      : 'Channel #28 did not fire; additional paired trials required to reach threshold.'}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 text-xs text-slate-400 italic">
                  Click "Test CS Alone" to deliver only Conditioned Stimulus on Channel #12 and verify if the biological network has formed an associative memory.
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-900 text-[11px] text-slate-400 space-y-1.5">
              <span className="font-bold text-slate-300 block">Biophysical Mechanism:</span>
              <p className="leading-relaxed">
                Bi & Poo (1998): Pre-synaptic activation (CS) preceding post-synaptic depolarization (US) by &lt;40 ms induces NMDA receptor Ca²⁺ influx and AMPA receptor recruitment, producing Long-Term Potentiation (LTP).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
