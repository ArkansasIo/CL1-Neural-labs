import React, { useRef, useEffect, useState } from 'react';
import { X, Zap, Activity, Waves, Info } from 'lucide-react';
import { NeuralCultureSimulator } from '../simulation/neuralCulture';
import { TOTAL_CHANNELS, UV_PER_RAW_ADC, GROUNDED_CHANNELS, REFERENCE_CHANNELS } from '../types/cl1';

interface ElectrodeDetailModalProps {
  channel: number;
  onClose: () => void;
  simulator: NeuralCultureSimulator;
  onStimulate: (channel: number) => void;
}

export const ElectrodeDetailModal: React.FC<ElectrodeDetailModalProps> = ({
  channel,
  onClose,
  simulator,
  onStimulate,
}) => {
  const oscCanvasRef = useRef<HTMLCanvasElement>(null);
  const spikeOverlayRef = useRef<HTMLCanvasElement>(null);

  const [visibleRangeUv, setVisibleRangeUv] = useState<number>(100);
  const [pulseDurationUs, setPulseDurationUs] = useState<number>(160);
  const [pulseCurrentUa, setPulseCurrentUa] = useState<number>(-1.0);

  const isGrounded = GROUNDED_CHANNELS.includes(channel as any);
  const isRef = REFERENCE_CHANNELS.includes(channel as any);
  const row = channel % 8;
  const col = Math.floor(channel / 8);

  // Render magnified oscilloscope
  useEffect(() => {
    let animId: number;

    const renderOscilloscope = () => {
      const canvas = oscCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;

      // Horizontal grid
      for (let y = 0; y <= h; y += h / 6) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Zero axis
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Waveform
      const history = simulator.getWaveformHistory(channel);
      if (history && history.length > 1) {
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const stepX = w / (history.length - 1);
        for (let i = 0; i < history.length; i++) {
          const val = history[i];
          const y = h / 2 - (val / visibleRangeUv) * (h / 2);
          const clampedY = Math.max(4, Math.min(h - 4, y));

          if (i === 0) ctx.moveTo(0, clampedY);
          else ctx.lineTo(i * stepX, clampedY);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(renderOscilloscope);
    };

    animId = requestAnimationFrame(renderOscilloscope);
    return () => cancelAnimationFrame(animId);
  }, [channel, visibleRangeUv, simulator]);

  // Render spike waveforms overlay
  useEffect(() => {
    const canvas = spikeOverlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Trigger vertical alignment marker at sample 25
    const triggerX = (25 / 75) * w;
    ctx.strokeStyle = '#dc2626';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(triggerX, 0);
    ctx.lineTo(triggerX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Find recent spikes detected on this channel
    const recentSpikes = simulator.getRecentSpikes().filter((s) => s.channel === channel);

    if (recentSpikes.length === 0) {
      // Draw standard synthetic reference spike
      drawSyntheticSpike(ctx, w, h);
    } else {
      // Draw up to 15 recent spikes with transparency
      const spikesToDraw = recentSpikes.slice(-15);
      for (const sp of spikesToDraw) {
        if (!sp.samples) continue;
        ctx.strokeStyle = 'rgba(72, 255, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let i = 0; i < sp.samples.length; i++) {
          const x = (i / 74) * w;
          const y = h / 2 - (sp.samples[i] / visibleRangeUv) * (h / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw mean template spike
      drawMeanSpike(ctx, spikesToDraw, w, h);
    }
  }, [channel, visibleRangeUv, simulator]);

  const drawSyntheticSpike = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#48ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let s = 0; s < 75; s++) {
      const x = (s / 74) * w;
      let val = 0;
      if (s < 25) val = -5 * Math.sin((s / 25) * Math.PI);
      else if (s === 25) val = -80;
      else if (s < 45) {
        const t = (s - 25) / 20;
        val = -80 * (1 - t) + 30 * Math.sin(t * Math.PI);
      } else {
        const t = (s - 45) / 30;
        val = 30 * Math.exp(-t * 2);
      }

      const y = h / 2 - (val / visibleRangeUv) * (h / 2);
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const drawMeanSpike = (ctx: CanvasRenderingContext2D, spikes: any[], w: number, h: number) => {
    const mean = new Float32Array(75);
    for (const sp of spikes) {
      if (!sp.samples) continue;
      for (let i = 0; i < 75; i++) {
        mean[i] += sp.samples[i] / spikes.length;
      }
    }

    ctx.strokeStyle = '#48ff00';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    for (let i = 0; i < 75; i++) {
      const x = (i / 74) * w;
      const y = h / 2 - (mean[i] / visibleRangeUv) * (h / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };


  const waveform = simulator.getWaveformHistory(channel);
  const waveformValues = Array.from(waveform);
  const waveformMean = waveformValues.reduce((a, b) => a + b, 0) / Math.max(1, waveformValues.length);
  const waveformMin = Math.min(...waveformValues);
  const waveformMax = Math.max(...waveformValues);
  const waveformPeakToPeak = waveformMax - waveformMin;
  const waveformRms = Math.sqrt(
    waveformValues.reduce((sum, value) => sum + value * value, 0) / Math.max(1, waveformValues.length),
  );
  const recentChannelSpikes = simulator.getRecentSpikes().filter((s) => s.channel === channel);
  const recentChannelStims = simulator.getRecentStims().filter((s) => s.channel === channel);
  const lastSpike = recentChannelSpikes[recentChannelSpikes.length - 1];
  const lastStim = recentChannelStims[recentChannelStims.length - 1];
  const isiMs = recentChannelSpikes.length > 1
    ? (recentChannelSpikes[recentChannelSpikes.length - 1].timestamp -
        recentChannelSpikes[recentChannelSpikes.length - 2].timestamp) / 25
    : null;
  const spikeAmplitude = lastSpike?.samples
    ? Math.max(...Array.from(lastSpike.samples)) - Math.min(...Array.from(lastSpike.samples))
    : null;
  const spikeTrough = lastSpike?.samples
    ? Math.min(...Array.from(lastSpike.samples))
    : null;
  const traceWindowMs = waveformValues.length * 20;

  const firingRates = simulator.getFiringRates();
  const rate = firingRates[channel] || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#0b101c] border border-cyan-500/30 rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center font-mono font-bold text-cyan-400">
              #{channel}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Electrode #{channel} Inspector</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Grid (Row {row}, Col {col})
                </span>
                {isGrounded ? (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-500">Grounded</span>
                ) : isRef ? (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                    Reference Channel
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Active Simulated Electrode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                CL1-compatible simulation node • 25 kHz acquisition reference
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Electrophysiology Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Firing Rate</span>
              <span className="text-emerald-400 font-mono text-base font-bold">{rate.toFixed(2)} Hz</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Trace Peak-to-Peak</span>
              <span className="text-cyan-400 font-mono text-base font-bold">{waveformPeakToPeak.toFixed(2)} μV</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Trace RMS</span>
              <span className="text-slate-200 font-mono text-base font-bold">{waveformRms.toFixed(2)} μV</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Trace Baseline</span>
              <span className="text-slate-200 font-mono text-base font-bold">{waveformMean.toFixed(2)} μV</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Trace Window</span>
              <span className="text-slate-300 font-mono">{traceWindowMs} ms</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Detected Spikes</span>
              <span className="text-emerald-300 font-mono">{recentChannelSpikes.length}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Last ISI</span>
              <span className="text-slate-300 font-mono">{isiMs === null ? '—' : isiMs.toFixed(1) + ' ms'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Stim Events</span>
              <span className="text-cyan-300 font-mono">{recentChannelStims.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Min / Max</span>
              <span className="text-slate-300 font-mono">{waveformMin.toFixed(1)} / {waveformMax.toFixed(1)} μV</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Latest Spike Trough</span>
              <span className="text-slate-300 font-mono">{spikeTrough === null ? '—' : spikeTrough.toFixed(1) + ' μV'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Latest Spike P-P</span>
              <span className="text-slate-300 font-mono">{spikeAmplitude === null ? '—' : spikeAmplitude.toFixed(1) + ' μV'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Latest Event</span>
              <span className="text-slate-300 font-mono">{lastStim ? 'STIM' : lastSpike ? 'SPIKE' : '—'}</span>
            </div>
          </div>

          {/* Continuous Oscilloscope Trace */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Waves className="w-4 h-4 text-cyan-400" />
                <span>Continuous Extracellular Potential (Live Oscilloscope)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Range:</span>
                <span className="text-cyan-400 font-mono font-bold">±{visibleRangeUv} μV</span>
                <input
                  type="range"
                  min="20"
                  max="500"
                  value={visibleRangeUv}
                  onChange={(e) => setVisibleRangeUv(Number(e.target.value))}
                  className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none accent-cyan-400"
                />
              </div>
            </div>

            <div className="h-44 w-full rounded-lg overflow-hidden border border-slate-800 relative bg-[#070b14]">
              <canvas ref={oscCanvasRef} width={700} height={176} className="w-full h-full block" />
              <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-500">
                +{visibleRangeUv} μV
              </div>
              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-500">
                -{visibleRangeUv} μV
              </div>
              <div className="absolute top-2 right-2 text-[10px] font-mono text-emerald-400/80 bg-black/60 px-1.5 py-0.5 rounded">
                Display trace • 20 ms simulation steps
              </div>
            </div>
          </div>

          {/* Action Potential Waveform Overlay (75 samples) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Detected Action Potentials (75-Sample Spike Waveforms)</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Trigger: Sample 25 (Red dashed line)
              </span>
            </div>

            <div className="h-36 w-full rounded-lg overflow-hidden border border-slate-800 relative bg-[#070b14]">
              <canvas ref={spikeOverlayRef} width={700} height={144} className="w-full h-full block" />
              <div className="absolute bottom-2 right-2 flex items-center gap-3 text-[10px] font-mono bg-black/70 px-2 py-1 rounded">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-0.5 bg-emerald-400 inline-block"></span> Mean Spike Template
                </span>
                <span className="flex items-center gap-1 text-emerald-400/50">
                  <span className="w-2 h-0.5 bg-emerald-400/50 inline-block"></span> Individual Events
                </span>
              </div>
            </div>
          </div>

          {/* Direct Stimulation Action */}
          {!isGrounded && (
            <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-cyan-300">Stimulate Electrode #{channel}</span>
                <span className="text-slate-400 text-[11px] font-mono">
                  (160 μs, -1.0 μA leading cathodic)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onStimulate(channel)}
                  className="px-4 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-500/30"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Deliver Biphasic Pulse</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
