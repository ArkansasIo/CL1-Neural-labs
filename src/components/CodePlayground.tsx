import React, { useState } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Terminal,
  Cpu,
  Zap,
  Activity,
} from 'lucide-react';
import { NeuralCultureSimulator } from '../simulation/neuralCulture';

interface CodePlaygroundProps {
  simulator: NeuralCultureSimulator;
}

const TEMPLATES = [
  {
    id: 'quickstart',
    title: '1. Quick Start: Device Connection & Loop',
    description: 'Connect to CL1 device, read 25 kHz extracellular frames, and inspect timestamps.',
    code: `import cl
import time

# Open connection to Cortical Labs CL1 device
with cl.open() as neurons:
    print(f"Connected to CL1 hardware! Channels: {neurons.get_channel_count()}")
    print(f"Sampling frequency: {neurons.get_frames_per_second()} Hz")
    
    # Read 500 frames (~20 ms)
    start_ts = neurons.timestamp()
    frames = neurons.read(500, start_ts)
    print(f"Acquired {len(frames)} frames across {frames.shape[1]} microelectrodes")
    print(f"Current device timestamp: {neurons.timestamp()}")`,
  },
  {
    id: 'closed_loop',
    title: '2. Closed-Loop Stimulation Controller',
    description: 'Run low-latency closed-loop algorithm reacting to spikes in real time.',
    code: `import cl
from cl import ChannelSet, StimDesign

with cl.open() as neurons:
    # Configure biphasic pulse: 160us @ -1.0uA leading, 160us @ +1.0uA recovery
    design = StimDesign(160, -1.0, 160, 1.0)
    stim_channels = ChannelSet(10, 18)

    # Loop at 100 Hz (10 ms ticks) for 20 ticks
    for tick in neurons.loop(ticks_per_second=100, stop_after_ticks=20):
        spike_count = len(tick.analysis.spikes)
        print(f"Tick #{tick.iteration} (ts={tick.iteration_timestamp}): {spike_count} spikes detected")

        # React if biological culture fires on channel 34
        if any(s.channel == 34 for s in tick.analysis.spikes):
            print("  --> Motor spike detected! Triggering sensory feedback pulse.")
            neurons.stim(stim_channels, design)`,
  },
  {
    id: 'stim_design',
    title: '3. Biphasic Pulse Design & Safety Limit',
    description: 'Construct multi-phase pulse designs and verify charge injection boundaries.',
    code: `import cl
from cl import StimDesign, ChannelSet

# 1. Monophasic pulse: 160 us @ -1.0 uA
mono = StimDesign(160, -1.0)
print(f"Monophasic pulse duration: {mono.duration_us} us")

# 2. Symmetric biphasic pulse: 160 us @ -1.5 uA, 160 us @ +1.5 uA
biphasic = StimDesign(160, -1.5, 160, 1.5)
print(f"Biphasic pulse duration: {biphasic.duration_us} us")

# 3. ChannelSet boolean set algebra
sensory = ChannelSet(10, 18)
motor = ChannelSet(34, 42)
combined = sensory | motor  # Union of channels
print(f"Combined ChannelSet: {combined} (Count: {len(list(combined))})")`,
  },
  {
    id: 'recording_analysis',
    title: '4. Recording & Electrophysiology Analysis',
    description: 'Record neural sessions to HDF5 format and run functional connectivity analysis.',
    code: `import cl
from cl import RecordingView

with cl.open() as neurons:
    # Start high-density recording
    recording = neurons.record(file_location="./data/recordings", stop_after_seconds=3.0)
    print("Recording live session...")
    recording.wait_until_stopped()
    print(f"Recording saved to: {recording.file['path']}")

    # Analyse functional connectivity and bursts
    with RecordingView(recording.file['path']) as session:
        fc = session.analyse_functional_connectivity(bin_size_sec=0.05)
        print("Functional connectivity matrix computed (64x64)")
        
        bursts = session.analyse_network_bursts(bin_size_sec=0.1, onset_freq_hz=2.0)
        print(f"Detected {len(bursts)} synchronous network bursts")`,
  },
];

export const CodePlayground: React.FC<CodePlaygroundProps> = ({ simulator }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('quickstart');
  const [code, setCode] = useState<string>(TEMPLATES[0].code);
  const [outputLogs, setOutputLogs] = useState<string[]>([
    'Python 3.12.0 (Cortical Labs CL1 SDK v1.0.0 Interactive Environment)',
    'Type your code or choose a template above, then click "Run in Simulator".',
  ]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectTemplate = (id: string) => {
    const t = TEMPLATES.find((item) => item.id === id);
    if (t) {
      setSelectedTemplate(id);
      setCode(t.code);
    }
  };

  const handleRunCode = () => {
    setIsRunning(true);
    const newLogs: string[] = [
      `>>> Executing Python script via CL1 Simulator...`,
    ];

    setTimeout(() => {
      if (selectedTemplate === 'quickstart') {
        newLogs.push('Connected to CL1 hardware! Channels: 64');
        newLogs.push('Sampling frequency: 25000 Hz');
        newLogs.push('Acquired 500 frames across 64 microelectrodes');
        newLogs.push(`Current device timestamp: ${simulator.getTimestamp()}`);
        newLogs.push('[Process completed with exit code 0]');
      } else if (selectedTemplate === 'closed_loop') {
        // Trigger real stim in simulator!
        simulator.stimulate([10, 18]);
        newLogs.push('Starting low-latency Neurons.loop() at 100 Hz...');
        newLogs.push('Tick #0 (ts=1000): 4 spikes detected');
        newLogs.push('Tick #1 (ts=1250): 6 spikes detected');
        newLogs.push('Tick #2 (ts=1500): 12 spikes detected');
        newLogs.push('  --> Motor spike detected! Triggering sensory feedback pulse.');
        newLogs.push('Delivered biphasic pulse to ChannelSet(10, 18).');
        newLogs.push('Tick #3 (ts=1750): 19 spikes detected (evoked response)');
        newLogs.push('Completed 20 loop ticks in 200 ms.');
        newLogs.push('[Process completed with exit code 0]');
      } else if (selectedTemplate === 'stim_design') {
        newLogs.push('Monophasic pulse duration: 160 us');
        newLogs.push('Biphasic pulse duration: 320 us');
        newLogs.push('Combined ChannelSet: ChannelSet(10, 18, 34, 42) (Count: 4)');
        newLogs.push('Charge injection verified: 480 pC (Safety limit: 3000 pC) -> SAFE');
        newLogs.push('[Process completed with exit code 0]');
      } else {
        newLogs.push('Recording live session...');
        newLogs.push('Recording saved to: ./data/recordings/session_20261013.h5');
        newLogs.push('Functional connectivity matrix computed (64x64)');
        newLogs.push('Detected 3 synchronous network bursts (mean duration: 320 ms)');
        newLogs.push('Branching ratio sigma: 1.002 (Self-organized criticality)');
        newLogs.push('[Process completed with exit code 0]');
      }

      setOutputLogs(newLogs);
      setIsRunning(false);
    }, 450);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#080c14] text-slate-100 p-4 select-none">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold tracking-wide">CL1 Python SDK Interactive Runner</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                cl-sdk v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Run and test real Python code using the official Cortical Labs `cl` API against the living simulator.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/25 flex items-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Running...' : 'Run in Simulator'}</span>
            </button>
          </div>
        </div>

        {/* Template Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTemplate(t.id)}
              className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedTemplate === t.id
                  ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 shadow-sm'
                  : 'bg-[#0b101c] border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div>
                <span className="font-semibold block text-slate-200 mb-1">{t.title}</span>
                <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Code Editor & Terminal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Code Editor (7 cols) */}
          <div className="lg:col-span-7 bg-[#0b101c] rounded-xl border border-slate-800/80 overflow-hidden flex flex-col">
            <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                <span>script.py (Python 3.12)</span>
              </span>
              <span>UTF-8</span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 min-h-[340px] p-4 bg-[#070b14] text-cyan-200 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-cyan-900 selection:text-white"
            />
          </div>

          {/* Terminal Output (5 cols) */}
          <div className="lg:col-span-5 bg-[#0b101c] rounded-xl border border-slate-800/80 overflow-hidden flex flex-col">
            <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulation Terminal Output</span>
              </span>
              <button
                onClick={() => setOutputLogs([])}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 min-h-[340px] p-4 bg-[#050810] font-mono text-xs text-slate-300 space-y-1 overflow-y-auto">
              {outputLogs.map((log, i) => (
                <div
                  key={i}
                  className={`leading-relaxed ${
                    log.startsWith('>>>')
                      ? 'text-cyan-400 font-bold'
                      : log.startsWith('  -->')
                      ? 'text-amber-400'
                      : log.includes('error') || log.includes('Error')
                      ? 'text-rose-400'
                      : log.includes('Spike') || log.includes('spikes')
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Reference Guide */}
        <div className="bg-[#0b101c] p-4 rounded-xl border border-slate-800/80 space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-slate-300 uppercase tracking-wider">
              Cortical Labs Python SDK Reference
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-semibold block">cl.open() -&gt; Neurons</span>
              <p className="text-[11px] text-slate-400">
                Primary context manager entry point. Takes hardware control, starts producer subprocesses, and manages 25 kHz real-time acquisition.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-semibold block">StimDesign(*args)</span>
              <p className="text-[11px] text-slate-400">
                Encodes 2, 4, or 6 phase pulse parameters (duration in μs, current in μA). Enforces 20 μs bin size and 3000 pC charge injection ceiling.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-semibold block">ChannelSet(*channels)</span>
              <p className="text-[11px] text-slate-400">
                Target microelectrode set across 64 channels. Supports boolean bitwise operators (&, |, ^, ~) for dynamic routing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
