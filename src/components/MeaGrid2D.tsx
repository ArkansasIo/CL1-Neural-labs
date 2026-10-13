import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  GROUNDED_CHANNELS,
  REFERENCE_CHANNELS,
  FLAG_HAS_SPIKE,
  FLAG_HAS_STIM,
  UV_PER_RAW_ADC,
  MeaAnalysisFrame,
} from '../types/cl1';
import { NeuralCultureSimulator } from '../simulation/neuralCulture';
import { Sliders, Zap, Eye, RefreshCw, ZoomIn } from 'lucide-react';

interface MeaGrid2DProps {
  simulator: NeuralCultureSimulator;
  onSelectChannel: (channel: number) => void;
  selectedChannel: number | null;
  onStimulateChannel: (channel: number) => void;
}

export const MeaGrid2D: React.FC<MeaGrid2DProps> = ({
  simulator,
  onSelectChannel,
  selectedChannel,
  onStimulateChannel,
}) => {
  // Voltage range in uV: default 100uV matching Cortical Labs default
  const [visibleRangeUv, setVisibleRangeUv] = useState<number>(100);
  const [dcOffsetCorrection, setDcOffsetCorrection] = useState<boolean>(true);
  const [hideCrosstalk, setHideCrosstalk] = useState<boolean>(true);
  const [clickToStimulate, setClickToStimulate] = useState<boolean>(false);
  const [hoveredChannel, setHoveredChannel] = useState<number | null>(null);

  // References to electrode canvases
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>(new Array(64).fill(null));
  const spikeFlashTimers = useRef<number[]>(new Array(64).fill(0));
  const stimFlashTimers = useRef<number[]>(new Array(64).fill(0));

  // Animation frame loop
  useEffect(() => {
    let animId: number;

    const renderGrid = () => {
      const now = performance.now();
      const firingRates = simulator.getFiringRates();

      for (let ch = 0; ch < 64; ch++) {
        const canvas = canvasRefs.current[ch];
        if (!canvas) continue;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const width = canvas.width;
        const height = canvas.height;
        const isGrounded = GROUNDED_CHANNELS.includes(ch as any);
        const isRef = REFERENCE_CHANNELS.includes(ch as any);

        // Clear canvas
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(0, 0, width, height);

        // Center zero line
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        if (isGrounded) {
          // Draw ground indicator
          ctx.fillStyle = '#475569';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⏚ GND', width / 2, height / 2 + 3);
          continue;
        }

        if (isRef) {
          ctx.fillStyle = '#64748b';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('REF', width / 2, height / 2 + 3);
          continue;
        }

        // Draw rolling extracellular voltage trace
        const waveform = simulator.getWaveformHistory(ch);
        if (waveform && waveform.length > 1) {
          ctx.strokeStyle = '#38bdf8'; // soft sky blue trace
          ctx.lineWidth = 1.2;
          ctx.beginPath();

          const stepX = width / (waveform.length - 1);
          const range = Math.max(10, visibleRangeUv);

          for (let i = 0; i < waveform.length; i++) {
            let val = waveform[i];
            if (dcOffsetCorrection) {
              // baseline correction
              val = val;
            }
            // Map voltage to canvas Y: -range to +range
            const y = height / 2 - (val / range) * (height / 2);
            const clampedY = Math.max(2, Math.min(height - 2, y));

            if (i === 0) {
              ctx.moveTo(0, clampedY);
            } else {
              ctx.lineTo(i * stepX, clampedY);
            }
          }
          ctx.stroke();
        }

        // Check for active spike flash
        const isSpikeFlash = now - spikeFlashTimers.current[ch] < 140;
        if (isSpikeFlash) {
          ctx.fillStyle = 'rgba(72, 255, 0, 0.25)';
          ctx.fillRect(0, 0, width, height);

          // Indicator pip in corner
          ctx.fillStyle = '#48ff00';
          ctx.beginPath();
          ctx.arc(width - 6, 6, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Check for active stim flash
        const isStimFlash = now - stimFlashTimers.current[ch] < 180;
        if (isStimFlash) {
          ctx.fillStyle = 'rgba(65, 255, 255, 0.35)';
          ctx.fillRect(0, 0, width, height);

          // Stim pip
          ctx.fillStyle = '#41ffff';
          ctx.beginPath();
          ctx.arc(width - 6, 6, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(renderGrid);
    };

    animId = requestAnimationFrame(renderGrid);
    return () => cancelAnimationFrame(animId);
  }, [visibleRangeUv, dcOffsetCorrection, hideCrosstalk, simulator]);

  // Subscribe to frame events to trigger flashes
  useEffect(() => {
    const unsubscribe = simulator.onFrame((frame: MeaAnalysisFrame) => {
      const now = performance.now();
      for (let ch = 0; ch < 64; ch++) {
        if (frame.flags[ch] & FLAG_HAS_SPIKE) {
          spikeFlashTimers.current[ch] = now;
        }
        if (frame.flags[ch] & FLAG_HAS_STIM) {
          stimFlashTimers.current[ch] = now;
        }
      }
    });
    return () => {
      unsubscribe();
    };
  }, [simulator]);

  const handleElectrodeClick = (channel: number) => {
    if (GROUNDED_CHANNELS.includes(channel as any)) return;

    if (clickToStimulate) {
      onStimulateChannel(channel);
    } else {
      onSelectChannel(channel);
    }
  };

  const firingRates = simulator.getFiringRates();

  return (
    <div className="flex flex-col h-full bg-[#080c14] text-slate-100 select-none">
      {/* MEA Controls Bar */}
      <div className="px-4 py-2.5 bg-[#0b111e] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Mode toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setClickToStimulate(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              !clickToStimulate
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect Mode</span>
          </button>

          <button
            onClick={() => setClickToStimulate(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              clickToStimulate
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Click to Stimulate</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1"></div>

          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={dcOffsetCorrection}
              onChange={(e) => setDcOffsetCorrection(e.target.checked)}
              className="accent-cyan-400 rounded"
            />
            <span>DC Offset Correction</span>
          </label>

          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={hideCrosstalk}
              onChange={(e) => setHideCrosstalk(e.target.checked)}
              className="accent-cyan-400 rounded"
            />
            <span>Hide Crosstalk</span>
          </label>
        </div>

        {/* Right: Voltage range controller */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1 rounded-md border border-slate-800">
            <span className="text-xs text-slate-400">Visible Range:</span>
            <span className="text-xs font-mono font-bold text-cyan-400">±{visibleRangeUv} μV</span>
            <input
              type="range"
              min="20"
              max="2000"
              step="10"
              value={visibleRangeUv}
              onChange={(e) => setVisibleRangeUv(Number(e.target.value))}
              className="w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1">
            {[50, 100, 200, 500].map((val) => (
              <button
                key={val}
                onClick={() => setVisibleRangeUv(val)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  visibleRangeUv === val
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
                }`}
              >
                ±{val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 8x8 MEA Grid Stage */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <div className="bg-[#0b101c] p-4 rounded-xl border border-slate-800/80 shadow-2xl relative max-w-4xl w-full">
          {/* Header Legend */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">CL1 Standard 8×8 MEA (64 Channels)</span>
              <span className="text-[11px] text-slate-500 font-mono">Channel = Col × 8 + Row</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-500/50"></span>
                <span className="text-slate-400">Spike Detected</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-500/50"></span>
                <span className="text-slate-400">Electrical Stim</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700 inline-block"></span>
                <span className="text-slate-400">Grounded (Corners)</span>
              </span>
            </div>
          </div>

          {/* 8x8 Grid */}
          <div className="grid grid-cols-8 gap-1.5 aspect-square max-h-[68vh] w-full mx-auto">
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 8 }).map((_, col) => {
                // Channel calculation: matching Cortical Labs col * 8 + row
                const channel = col * 8 + row;
                const isGrounded = GROUNDED_CHANNELS.includes(channel as any);
                const isRef = REFERENCE_CHANNELS.includes(channel as any);
                const isSelected = selectedChannel === channel;
                const isHovered = hoveredChannel === channel;
                const rate = firingRates[channel] || 0;

                return (
                  <div
                    key={channel}
                    onClick={() => handleElectrodeClick(channel)}
                    onMouseEnter={() => setHoveredChannel(channel)}
                    onMouseLeave={() => setHoveredChannel(null)}
                    className={`relative rounded-md overflow-hidden border transition-all cursor-pointer flex flex-col ${
                      isGrounded
                        ? 'bg-slate-950/80 border-slate-900 cursor-not-allowed opacity-60'
                        : isRef
                        ? 'bg-slate-900/60 border-slate-800'
                        : isSelected
                        ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : isHovered
                        ? 'border-cyan-500/60 shadow-sm'
                        : 'border-slate-800/80 hover:border-slate-700 bg-[#090e1a]'
                    }`}
                  >
                    {/* Electrode Info Overlay */}
                    <div className="absolute top-1 left-1.5 right-1.5 flex items-center justify-between text-[10px] font-mono pointer-events-none z-10">
                      <span className={`font-bold ${isGrounded ? 'text-slate-600' : isRef ? 'text-slate-500' : 'text-slate-400'}`}>
                        #{channel}
                      </span>
                      {!isGrounded && !isRef && rate > 0 && (
                        <span className="text-[9px] text-emerald-400 font-medium">
                          {rate.toFixed(1)}Hz
                        </span>
                      )}
                    </div>

                    {/* Mini Waveform Canvas */}
                    <div className="flex-1 w-full h-full pt-4">
                      <canvas
                        ref={(el) => {
                          canvasRefs.current[channel] = el;
                        }}
                        width={100}
                        height={60}
                        className="w-full h-full block"
                      />
                    </div>

                    {/* Hover Quick Action Hint */}
                    {isHovered && !isGrounded && (
                      <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-semibold text-cyan-200 px-1.5 py-0.5 rounded bg-black/70 border border-cyan-500/40">
                          {clickToStimulate ? 'Click: Stim' : 'Click: Inspect'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Active Hover Inspector Bar */}
          {hoveredChannel !== null && (
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-300">
              <div className="flex items-center gap-4">
                <span>
                  Electrode: <strong className="text-cyan-400">Channel #{hoveredChannel}</strong>
                </span>
                <span>
                  Grid Position: Row {hoveredChannel % 8}, Col {Math.floor(hoveredChannel / 8)}
                </span>
                <span>
                  Firing Rate: <strong className="text-emerald-400">{firingRates[hoveredChannel]?.toFixed(1) || '0.0'} Hz</strong>
                </span>
                <span>
                  Status:{' '}
                  {GROUNDED_CHANNELS.includes(hoveredChannel as any) ? (
                    <span className="text-slate-500">Grounded (Reference Ground)</span>
                  ) : REFERENCE_CHANNELS.includes(hoveredChannel as any) ? (
                    <span className="text-amber-400">Hardware Reference</span>
                  ) : (
                    <span className="text-cyan-400">Active Cortical Electrode</span>
                  )}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {clickToStimulate ? 'Click to trigger biphasic stim pulse' : 'Click to open magnified oscilloscope'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
