import React, { useRef, useEffect, useState } from 'react';
import {
  Activity,
  Gauge,
  Network,
  BarChart3,
  Flame,
  Info,
  RefreshCw,
} from 'lucide-react';
import { NeuralCultureSimulator } from '../simulation/neuralCulture';
import { ElectrophysiologyAnalysisEngine } from '../simulation/analysisEngine';
import { AnalyticsSnapshot, GROUNDED_CHANNELS, REFERENCE_CHANNELS } from '../types/cl1';

interface AnalyticsSuiteProps {
  simulator: NeuralCultureSimulator;
}

export const AnalyticsSuite: React.FC<AnalyticsSuiteProps> = ({ simulator }) => {
  const rasterCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ElectrophysiologyAnalysisEngine | null>(null);

  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [selectedPair, setSelectedPair] = useState<{ c1: number; c2: number; corr: number } | null>(null);
  const [rasterTimeWindowSec, setRasterTimeWindowSec] = useState<number>(4);

  // Initialize analysis engine
  useEffect(() => {
    const engine = new ElectrophysiologyAnalysisEngine(simulator);
    engineRef.current = engine;
    setSnapshot(engine.computeSnapshot());

    const interval = setInterval(() => {
      setSnapshot(engine.computeSnapshot());
    }, 800);

    return () => clearInterval(interval);
  }, [simulator]);

  // Render rolling Spike Raster Plot
  useEffect(() => {
    let animId: number;

    const renderRaster = () => {
      const canvas = rasterCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Dark background
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, w, h);

      // Grid channel lines
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      const channelHeight = h / 64;

      for (let ch = 0; ch < 64; ch += 8) {
        ctx.beginPath();
        ctx.moveTo(0, ch * channelHeight);
        ctx.lineTo(w, ch * channelHeight);
        ctx.stroke();
      }

      const recentSpikes = simulator.getRecentSpikes();
      const recentStims = simulator.getRecentStims();
      const currentTs = simulator.getTimestamp();
      const windowSamples = rasterTimeWindowSec * 25000;
      const startTs = currentTs - windowSamples;

      // Draw spikes
      ctx.fillStyle = '#48ff00';
      for (const sp of recentSpikes) {
        if (sp.timestamp < startTs || sp.timestamp > currentTs) continue;
        const x = ((sp.timestamp - startTs) / windowSamples) * w;
        const y = sp.channel * channelHeight;
        ctx.fillRect(x, y, 2.5, channelHeight * 0.85);
      }

      // Draw stims
      ctx.fillStyle = '#00e5ff';
      for (const st of recentStims) {
        if (st.timestamp < startTs || st.timestamp > currentTs) continue;
        const x = ((st.timestamp - startTs) / windowSamples) * w;
        const y = st.channel * channelHeight;
        ctx.fillRect(x - 1, y - 2, 4, channelHeight + 4);
      }

      animId = requestAnimationFrame(renderRaster);
    };

    animId = requestAnimationFrame(renderRaster);
    return () => cancelAnimationFrame(animId);
  }, [rasterTimeWindowSec, simulator]);

  return (
    <div className="h-full overflow-y-auto bg-[#080c14] text-slate-100 p-4 select-none">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold tracking-wide">CL1 Electrophysiology Analytics Suite</h2>
            </div>
            <p className="text-xs text-slate-400">
              Quantitative measures matching Cortical Labs analysis suite: Functional Connectivity, Raster dynamics, Criticality, and PSTH.
            </p>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Mean Population Firing</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {snapshot?.averageFiringRateHz || '0.00'}
              </span>
              <span className="text-slate-500 font-mono text-xs">Hz / channel</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Branching Ratio (σ)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {snapshot?.networkCriticalityBranchingRatio || '1.000'}
              </span>
              <span className="text-emerald-400 font-mono text-xs font-semibold">Critical State</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">σ ≈ 1.0 indicates optimal information capacity</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Information Entropy</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {snapshot?.informationEntropyBits || '2.84'}
              </span>
              <span className="text-slate-500 font-mono text-xs">bits</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Lempel-Ziv: {snapshot?.lempelZivComplexity || '0.64'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0b101c] border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Synchronous Bursts</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-purple-400">
                {snapshot?.burstFrequencyHz || '0.18'}
              </span>
              <span className="text-slate-500 font-mono text-xs">Hz (Network)</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Synchrony: 75% active channels</span>
          </div>
        </div>

        {/* Live Multi-Channel Spike Raster Plot */}
        <div className="bg-[#0b101c] p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-300 uppercase tracking-wider">
                Multi-Channel Spike Raster Plot (Channels 0 – 63)
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-400"></span>
                <span>Spike Event</span>
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span>
                <span>Stimulation Pulse</span>
              </span>

              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-slate-400">Window:</span>
                {[2, 4, 8].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setRasterTimeWindowSec(sec)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                      rasterTimeWindowSec === sec
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-48 w-full rounded-lg overflow-hidden border border-slate-800 relative bg-[#070b14]">
            <canvas ref={rasterCanvasRef} width={800} height={192} className="w-full h-full block" />
            <div className="absolute top-1 left-2 text-[10px] font-mono text-slate-500">Ch 0</div>
            <div className="absolute bottom-1 left-2 text-[10px] font-mono text-slate-500">Ch 63</div>
            <div className="absolute bottom-1 right-2 text-[10px] font-mono text-slate-500">t = now</div>
          </div>
        </div>

        {/* 2-Column Grid: Functional Connectivity Matrix & PSTH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Functional Connectivity Heatmap (7 cols) */}
          <div className="lg:col-span-7 bg-[#0b101c] p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Network className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-300 uppercase tracking-wider">
                  64×64 Functional Connectivity Matrix
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Pearson Correlation (r ∈ [0, 1])
              </span>
            </div>

            {/* Matrix Canvas / Grid */}
            <div className="aspect-square max-h-[340px] w-full mx-auto p-1 bg-slate-950 rounded-lg border border-slate-900 overflow-hidden">
              <div className="grid grid-cols-64 gap-[1px] w-full h-full">
                {snapshot?.functionalConnectivityMatrix &&
                  snapshot.functionalConnectivityMatrix.flatMap((row, rIdx) =>
                    row.map((val, cIdx) => {
                      const isGrounded =
                        GROUNDED_CHANNELS.includes(rIdx as any) || GROUNDED_CHANNELS.includes(cIdx as any);
                      const isDiag = rIdx === cIdx;

                      // Color interpolation from deep navy to cyan to bright yellow
                      let bg = '#070b14';
                      if (!isGrounded && !isDiag) {
                        if (val > 0.6) bg = `rgba(255, 235, 59, ${val})`;
                        else if (val > 0.3) bg = `rgba(0, 229, 255, ${val * 1.2})`;
                        else if (val > 0.05) bg = `rgba(14, 165, 233, ${val * 0.8})`;
                      } else if (isDiag) {
                        bg = 'rgba(72, 255, 0, 0.4)';
                      }

                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          style={{ backgroundColor: bg }}
                          onMouseEnter={() =>
                            setSelectedPair({ c1: rIdx, c2: cIdx, corr: isDiag ? 1.0 : val })
                          }
                          className="w-full h-full cursor-crosshair transition-opacity hover:opacity-100 hover:ring-1 hover:ring-white"
                        />
                      );
                    })
                  )}
              </div>
            </div>

            {/* Hover details */}
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1">
              <span>
                {selectedPair ? (
                  <>
                    Electrode Pair: <strong className="text-cyan-300">Ch #{selectedPair.c1}</strong> ↔{' '}
                    <strong className="text-cyan-300">Ch #{selectedPair.c2}</strong> • Correlation:{' '}
                    <strong className="text-emerald-400">{selectedPair.corr.toFixed(3)}</strong>
                  </>
                ) : (
                  'Hover over matrix cells to inspect pairwise channel correlation'
                )}
              </span>
            </div>
          </div>

          {/* Peristimulus Time Histogram (PSTH) (5 cols) */}
          <div className="lg:col-span-5 bg-[#0b101c] p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-300 uppercase tracking-wider">
                  Evoked PSTH (0 – 100 ms)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Post-Stimulus Latency</span>
            </div>

            {/* Histogram Bar Chart */}
            <div className="h-[260px] bg-slate-950 p-3 rounded-lg border border-slate-900 flex flex-col justify-end">
              <div className="flex-1 flex items-end gap-1.5 pb-2">
                {(snapshot?.psthBins || []).map((bin, i) => {
                  const maxVal = Math.max(1, ...((snapshot?.psthBins || []).map((b) => b.count)));
                  const pct = (bin.count / maxVal) * 100;
                  const isPeak = bin.timeMs >= 10 && bin.timeMs <= 25;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div
                        style={{ height: `${Math.max(6, pct)}%` }}
                        className={`w-full rounded-t-sm transition-all ${
                          isPeak
                            ? 'bg-gradient-to-t from-cyan-600 to-cyan-300 group-hover:brightness-125'
                            : 'bg-gradient-to-t from-slate-700 to-slate-500 group-hover:brightness-125'
                        }`}
                        title={`${bin.timeMs.toFixed(1)} ms: ${bin.count} evoked spikes`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Time X-Axis */}
              <div className="flex justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-1.5">
                <span>0 ms (Stim)</span>
                <span>25 ms (Direct)</span>
                <span>60 ms (Polysynaptic)</span>
                <span>100 ms</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Early peak (10–25 ms) corresponds to direct monosynaptic activation of neighboring neural soma; secondary wave (40–80 ms) captures recurrent polysynaptic reverberations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
