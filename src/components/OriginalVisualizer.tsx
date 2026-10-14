import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { NeuralCultureSimulator } from '../simulation/neuralCulture';

type Props = {
  simulator: NeuralCultureSimulator;
};

function SignalDetailGraph({ simulator }: Props) {
  const [channel, setChannel] = useState(27);
  const [history, setHistory] = useState<number[]>(() => Array.from(simulator.getWaveformHistory(27)));
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => {
      setHistory(Array.from(simulator.getWaveformHistory(channel)));
    }, 100);
    return () => window.clearInterval(timer);
  }, [simulator, channel, live]);

  const stats = useMemo(() => {
    const values = history.filter(Number.isFinite);
    if (!values.length) return { min: 0, max: 0, pp: 0, rms: 0, mean: 0, noise: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const rms = Math.sqrt(values.reduce((a, b) => a + b * b, 0) / values.length);
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    return { min, max, pp: max - min, rms, mean, noise: Math.sqrt(variance) };
  }, [history]);

  const width = 900;
  const height = 260;
  const pad = 28;
  const yAbs = Math.max(50, Math.ceil(Math.max(Math.abs(stats.min), Math.abs(stats.max)) / 10) * 10);
  const points = history.map((v, i) => {
    const x = pad + (i / Math.max(1, history.length - 1)) * (width - pad * 2);
    const y = height / 2 - (v / yAbs) * (height / 2 - pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const zeroY = height / 2;
  const selectedIsGrounded = [0, 7, 56, 63].includes(channel);
  const firingRate = simulator.getFiringRates()[channel] ?? 0;
  const spikes = simulator.getRecentSpikes().filter((s) => s.channel === channel).slice(-20);
  const stims = simulator.getRecentStims().filter((s) => s.channel === channel).slice(-20);

  return (
    <section className="border-b border-slate-800 bg-[#080d17] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-400">Signal detail graph</div>
          <div className="text-sm font-semibold text-slate-100">Channel {channel} • live simulator trace</div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="text-slate-400">Channel</label>
          <select value={channel} onChange={(e) => { setChannel(Number(e.target.value)); setLive(true); }} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100">
            {Array.from({ length: 64 }, (_, i) => <option key={i} value={i}>CH {i}</option>)}
          </select>
          <button onClick={() => setLive((v) => !v)} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300">
            {live ? 'Pause trace' : 'Resume trace'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-black/60 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[260px]" role="img" aria-label={`Signal waveform for channel ${channel}`}>
          <rect width={width} height={height} fill="#03060b" />
          {[0.25, 0.5, 0.75].map((fraction) => (
            <line key={fraction} x1={pad} x2={width - pad} y1={height * fraction} y2={height * fraction} stroke="#1e293b" strokeWidth="1" />
          ))}
          <line x1={pad} x2={width - pad} y1={zeroY} y2={zeroY} stroke="#475569" strokeDasharray="5 5" />
          <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
          <text x={8} y={pad} fill="#94a3b8" fontSize="10">+{yAbs.toFixed(0)} µV</text>
          <text x={8} y={zeroY + 4} fill="#64748b" fontSize="10">0 µV</text>
          <text x={8} y={height - 8} fill="#94a3b8" fontSize="10">-{yAbs.toFixed(0)} µV</text>
          <text x={width - 85} y={height - 8} fill="#64748b" fontSize="10">4.0 s window</text>
        </svg>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
        {[
          ['Peak-to-peak', stats.pp, 'µV'],
          ['RMS', stats.rms, 'µV'],
          ['Baseline', stats.mean, 'µV'],
          ['Noise RMS', stats.noise, 'µV'],
          ['Firing rate', firingRate, 'Hz'],
        ].map(([label, value, unit]) => (
          <div key={String(label)} className="rounded border border-slate-800 bg-slate-900/60 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
            <div className="font-mono text-sm text-slate-200">{Number(value).toFixed(2)} <span className="text-slate-500">{unit}</span></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-slate-400">
        <span>Min {stats.min.toFixed(2)} µV</span>
        <span>Max {stats.max.toFixed(2)} µV</span>
        <span>Recent spikes {spikes.length}</span>
        <span>Recent stim events {stims.length}</span>
        <span className={selectedIsGrounded ? 'text-amber-400' : 'text-emerald-400'}>
          {selectedIsGrounded ? 'Ground/reference channel' : 'Simulated active channel'}
        </span>
        <span className="text-slate-500">200 simulator samples × 20 ms ≈ 4 s</span>
      </div>
    </section>
  );
}

export const OriginalVisualizer: React.FC<Props> = ({ simulator }) => {
  const [iframeKey, setIframeKey] = useState<number>(0);

  const handleReload = () => setIframeKey((prev) => prev + 1);
  const handleOpenNewTab = () => window.open(`${import.meta.env.BASE_URL}visualiser/index.html`, '_blank');

  return (
    <div className="h-full flex flex-col bg-[#080c14] text-slate-100 select-none overflow-auto">
      <SignalDetailGraph simulator={simulator} />

      <div className="px-4 py-2 bg-[#0b101c] border-b border-slate-800 flex items-center justify-between text-xs sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Native CL Visualizer</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">2D / 3D MEA view</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReload} className="p-1.5 rounded text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition" title="Reload visualizer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleOpenNewTab} className="px-2.5 py-1 rounded text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-800 flex items-center gap-1.5 hover:bg-cyan-900/60 transition">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Standalone</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[520px] w-full bg-black relative">
        <iframe key={iframeKey} src={`${import.meta.env.BASE_URL}visualiser/index.html`} className="w-full h-full min-h-[520px] border-none block" title="Cortical Labs CL1 Native Visualizer" />
      </div>
    </div>
  );
};
