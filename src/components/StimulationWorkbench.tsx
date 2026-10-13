import React, { useState } from 'react';
import {
  Zap,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Check,
  Copy,
  Code,
  Flame,
  Radio,
} from 'lucide-react';
import { NeuralCultureSimulator } from '../simulation/neuralCulture';
import {
  TOTAL_CHANNELS,
  GROUNDED_CHANNELS,
  REFERENCE_CHANNELS,
  StimDesignConfig,
} from '../types/cl1';

interface StimulationWorkbenchProps {
  simulator: NeuralCultureSimulator;
  onStimulateDelivered?: (channels: number[]) => void;
}

export const StimulationWorkbench: React.FC<StimulationWorkbenchProps> = ({
  simulator,
  onStimulateDelivered,
}) => {
  // Pulse design parameters
  const [pulseType, setPulseType] = useState<'biphasic' | 'monophasic' | 'triphasic'>('biphasic');
  const [phase1DurationUs, setPhase1DurationUs] = useState<number>(160);
  const [phase1CurrentUa, setPhase1CurrentUa] = useState<number>(-1.0); // Cathodic leading edge
  const [phase2DurationUs, setPhase2DurationUs] = useState<number>(160);
  const [phase2CurrentUa, setPhase2CurrentUa] = useState<number>(1.0);   // Anodic recovery
  const [phase3DurationUs, setPhase3DurationUs] = useState<number>(160);
  const [phase3CurrentUa, setPhase3CurrentUa] = useState<number>(-1.0);

  // Burst train parameters
  const [isBurstTrain, setIsBurstTrain] = useState<boolean>(false);
  const [burstPulseCount, setBurstPulseCount] = useState<number>(5);
  const [burstFrequencyHz, setBurstFrequencyHz] = useState<number>(20);

  // Selected ChannelSet (boolean array of 64 channels)
  const [selectedChannels, setSelectedChannels] = useState<boolean[]>(() => {
    const arr = new Array(TOTAL_CHANNELS).fill(false);
    // Default select DishBrain sensory channels 10, 18
    arr[10] = true;
    arr[18] = true;
    return arr;
  });

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Calculate total charge injection in picocoulombs (pC): charge = sum(|duration_us * current_uA|)
  let totalDurationUs = phase1DurationUs;
  let totalChargePc = Math.abs(phase1DurationUs * phase1CurrentUa);

  if (pulseType === 'biphasic' || pulseType === 'triphasic') {
    totalDurationUs += phase2DurationUs;
    totalChargePc += Math.abs(phase2DurationUs * phase2CurrentUa);
  }
  if (pulseType === 'triphasic') {
    totalDurationUs += phase3DurationUs;
    totalChargePc += Math.abs(phase3DurationUs * phase3CurrentUa);
  }

  // Cortical Labs CL1 safety limit: 3000 pC (3.0 nC)
  const isSafetyViolated = totalChargePc > 3000;
  const isDurationValid = phase1DurationUs % 20 === 0 && (pulseType === 'monophasic' || phase2DurationUs % 20 === 0);

  const activeChannelCount = selectedChannels.filter(Boolean).length;

  const toggleChannel = (ch: number) => {
    if (GROUNDED_CHANNELS.includes(ch as any) || REFERENCE_CHANNELS.includes(ch as any)) return;
    const next = [...selectedChannels];
    next[ch] = !next[ch];
    setSelectedChannels(next);
  };

  const selectPreset = (type: 'sensory' | 'motor' | 'ring' | 'all' | 'clear') => {
    const next = new Array(TOTAL_CHANNELS).fill(false);
    if (type === 'sensory') {
      next[10] = true;
      next[18] = true;
    } else if (type === 'motor') {
      next[34] = true;
      next[42] = true;
    } else if (type === 'ring') {
      [18, 19, 20, 21, 26, 29, 34, 37, 42, 43, 44, 45].forEach((ch) => (next[ch] = true));
    } else if (type === 'all') {
      for (let ch = 0; ch < TOTAL_CHANNELS; ch++) {
        if (!GROUNDED_CHANNELS.includes(ch as any) && !REFERENCE_CHANNELS.includes(ch as any)) {
          next[ch] = true;
        }
      }
    }
    setSelectedChannels(next);
  };

  const invertChannelSet = () => {
    const next = selectedChannels.map((selected, ch) => {
      if (GROUNDED_CHANNELS.includes(ch as any) || REFERENCE_CHANNELS.includes(ch as any)) return false;
      return !selected;
    });
    setSelectedChannels(next);
  };

  const handleDeliverStimulation = () => {
    if (isSafetyViolated) {
      setStatusMessage('Error: Charge injection exceeds 3000 pC hardware safety limit.');
      return;
    }

    const channelList: number[] = [];
    selectedChannels.forEach((selected, ch) => {
      if (selected) channelList.push(ch);
    });

    if (channelList.length === 0) {
      setStatusMessage('Warning: No channels selected in ChannelSet.');
      return;
    }

    const phases = [{ durationUs: phase1DurationUs, currentUa: phase1CurrentUa }];
    if (pulseType === 'biphasic' || pulseType === 'triphasic') {
      phases.push({ durationUs: phase2DurationUs, currentUa: phase2CurrentUa });
    }
    if (pulseType === 'triphasic') {
      phases.push({ durationUs: phase3DurationUs, currentUa: phase3CurrentUa });
    }

    const design: StimDesignConfig = {
      phases,
      totalDurationUs,
      totalChargePc,
    };

    if (isBurstTrain && burstPulseCount > 1) {
      // Deliver train of pulses with interval
      const intervalMs = 1000 / burstFrequencyHz;
      for (let i = 0; i < burstPulseCount; i++) {
        setTimeout(() => {
          simulator.stimulate(channelList, design);
        }, i * intervalMs);
      }
      setStatusMessage(`Delivering train of ${burstPulseCount} pulses at ${burstFrequencyHz} Hz across ${channelList.length} channels...`);
    } else {
      simulator.stimulate(channelList, design);
      setStatusMessage(`Delivered biphasic pulse to ${channelList.length} electrodes (${channelList.join(', ')}).`);
    }

    onStimulateDelivered?.(channelList);

    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Generate equivalent Python CL SDK code
  const selectedChannelList = selectedChannels.map((s, ch) => (s ? ch : null)).filter((x) => x !== null);
  const pythonChannelsCode = `ChannelSet(${selectedChannelList.join(', ')})`;
  let pythonDesignCode = '';
  if (pulseType === 'monophasic') {
    pythonDesignCode = `StimDesign(${phase1DurationUs}, ${phase1CurrentUa.toFixed(1)})`;
  } else if (pulseType === 'biphasic') {
    pythonDesignCode = `StimDesign(${phase1DurationUs}, ${phase1CurrentUa.toFixed(1)}, ${phase2DurationUs}, ${phase2CurrentUa.toFixed(1)})`;
  } else {
    pythonDesignCode = `StimDesign(${phase1DurationUs}, ${phase1CurrentUa.toFixed(1)}, ${phase2DurationUs}, ${phase2CurrentUa.toFixed(1)}, ${phase3DurationUs}, ${phase3CurrentUa.toFixed(1)})`;
  }

  const generatedPythonScript = `import cl
from cl import ChannelSet, StimDesign

# Open connection to Cortical Labs CL1 system
with cl.open() as neurons:
    # 1. Define biphasic stimulation pulse (${totalChargePc} pC charge)
    design = ${pythonDesignCode}

    # 2. Select target microelectrodes (${selectedChannelList.length} channels)
    channels = ${pythonChannelsCode}

    # 3. Deliver electrical stimulation to biological neural network
    neurons.stim(channels, design)`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedPythonScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#080c14] text-slate-100 p-4 select-none">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold tracking-wide">CL1 Stimulation Workbench & Pulse Designer</h2>
            </div>
            <p className="text-xs text-slate-400">
              Configure biphasic/triphasic waveforms, build ChannelSets, and deliver targeted electrical pulses to the wetware.
            </p>
          </div>

          {/* Safety Status Pill */}
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
              isSafetyViolated
                ? 'bg-rose-950/80 border-rose-500/80 text-rose-300'
                : 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
            }`}
          >
            {isSafetyViolated ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
            <div>
              <span>Charge: <strong>{totalChargePc.toFixed(0)} pC</strong> / 3000 pC Limit</span>
            </div>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className="p-3 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center justify-between">
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 2-Column Grid: Pulse Designer & ChannelSet Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (5 cols): Pulse Waveform Configurator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#0b101c] p-4 rounded-xl border border-slate-800/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-400" />
                1. Waveform Design (`StimDesign`)
              </h3>

              {/* Pulse Type Selector */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                {(['biphasic', 'monophasic', 'triphasic'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPulseType(t)}
                    className={`py-1.5 rounded font-medium capitalize transition ${
                      pulseType === t
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Phase 1: Cathodic Leading Edge */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-300">Phase 1 (Cathodic Pulse)</span>
                  <span className="text-[11px] font-mono text-slate-400">{phase1DurationUs} μs @ {phase1CurrentUa.toFixed(1)} μA</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Duration (20 μs step):</span>
                    <span className="font-mono text-cyan-400">{phase1DurationUs} μs</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="600"
                    step="20"
                    value={phase1DurationUs}
                    onChange={(e) => setPhase1DurationUs(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg accent-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Current (-3.0 to +3.0 μA):</span>
                    <span className="font-mono text-cyan-400">{phase1CurrentUa.toFixed(2)} μA</span>
                  </div>
                  <input
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.1"
                    value={phase1CurrentUa}
                    onChange={(e) => setPhase1CurrentUa(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg accent-cyan-400"
                  />
                </div>
              </div>

              {/* Phase 2: Anodic Recovery */}
              {(pulseType === 'biphasic' || pulseType === 'triphasic') && (
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-300">Phase 2 (Anodic Recovery)</span>
                    <span className="text-[11px] font-mono text-slate-400">{phase2DurationUs} μs @ {phase2CurrentUa.toFixed(1)} μA</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Duration (20 μs step):</span>
                      <span className="font-mono text-emerald-400">{phase2DurationUs} μs</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="600"
                      step="20"
                      value={phase2DurationUs}
                      onChange={(e) => setPhase2DurationUs(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg accent-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Current:</span>
                      <span className="font-mono text-emerald-400">{phase2CurrentUa.toFixed(2)} μA</span>
                    </div>
                    <input
                      type="range"
                      min="-3.0"
                      max="3.0"
                      step="0.1"
                      value={phase2CurrentUa}
                      onChange={(e) => setPhase2CurrentUa(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg accent-emerald-400"
                    />
                  </div>
                </div>
              )}

              {/* Burst Train Options */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBurstTrain}
                      onChange={(e) => setIsBurstTrain(e.target.checked)}
                      className="accent-cyan-400 rounded"
                    />
                    <span className="font-semibold text-slate-200">Stimulation Burst Train</span>
                  </label>
                  {isBurstTrain && <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                </div>

                {isBurstTrain && (
                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Pulse Count: {burstPulseCount}</span>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        value={burstPulseCount}
                        onChange={(e) => setBurstPulseCount(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded accent-cyan-400"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Frequency: {burstFrequencyHz} Hz</span>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={burstFrequencyHz}
                        onChange={(e) => setBurstFrequencyHz(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded accent-cyan-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleDeliverStimulation}
                disabled={isSafetyViolated || activeChannelCount === 0}
                className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                  isSafetyViolated || activeChannelCount === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 active:scale-[0.99]'
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Deliver Electrical Stimulation ({activeChannelCount} Electrodes)</span>
              </button>
            </div>
          </div>

          {/* Right Column (7 cols): ChannelSet Matrix & Python Code Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#0b101c] p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  2. Select Electrodes (`ChannelSet`)
                </h3>

                {/* Preset Chips */}
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    onClick={() => selectPreset('sensory')}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 hover:bg-slate-800"
                  >
                    Sensory (10, 18)
                  </button>
                  <button
                    onClick={() => selectPreset('motor')}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300 hover:bg-slate-800"
                  >
                    Motor (34, 42)
                  </button>
                  <button
                    onClick={() => selectPreset('ring')}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 hover:bg-slate-800"
                  >
                    Center Ring
                  </button>
                  <button
                    onClick={invertChannelSet}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-300 hover:bg-slate-800"
                  >
                    Invert (~)
                  </button>
                  <button
                    onClick={() => selectPreset('clear')}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* 8x8 Selection Matrix */}
              <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-900">
                <div className="grid grid-cols-8 gap-1.5 aspect-[8/5] w-full">
                  {Array.from({ length: 8 }).map((_, row) =>
                    Array.from({ length: 8 }).map((_, col) => {
                      const ch = col * 8 + row;
                      const isGrounded = GROUNDED_CHANNELS.includes(ch as any);
                      const isRef = REFERENCE_CHANNELS.includes(ch as any);
                      const isSelected = selectedChannels[ch];

                      return (
                        <button
                          key={ch}
                          disabled={isGrounded || isRef}
                          onClick={() => toggleChannel(ch)}
                          className={`rounded text-[10px] font-mono flex items-center justify-center transition border ${
                            isGrounded
                              ? 'bg-slate-950 border-slate-900 text-slate-700 cursor-not-allowed'
                              : isRef
                              ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                              : isSelected
                              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-300 shadow-sm shadow-cyan-500/50 scale-[1.03]'
                              : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-cyan-500/40 hover:text-slate-200'
                          }`}
                          title={`Channel #${ch} (Row ${row}, Col ${col})`}
                        >
                          {isGrounded ? '⏚' : isRef ? 'R' : ch}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Selected: <strong className="text-cyan-400">{activeChannelCount} channels</strong></span>
                <span className="font-mono text-slate-500">Grounded corners 0, 7, 56, 63 locked</span>
              </div>
            </div>

            {/* Live Generated Python Script Box */}
            <div className="bg-[#0b101c] p-4 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-cyan-400" />
                  Python SDK Implementation (`cl-sdk`)
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-cyan-300/90 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {generatedPythonScript}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
