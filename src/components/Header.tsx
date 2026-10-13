import React, { useState } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Cpu,
  Layers,
  Zap,
  Sliders,
  Gauge,
  Code2,
  Gamepad2,
  ExternalLink,
  BookOpen,
  Settings,
  Volume2,
  VolumeX,
  Database,
  Route,
  GraduationCap,
} from 'lucide-react';
import { CultureParameters } from '../types/cl1';
import { globalAudioSynth } from '../simulation/audioSynth';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onReset: () => void;
  cultureParams: CultureParameters;
  onChangeCultureParams: (params: Partial<CultureParameters>) => void;
  totalSpikes: number;
  totalStims: number;
  fps: number;
  onOpenResearch: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isPaused,
  onTogglePause,
  playbackSpeed,
  onChangeSpeed,
  onReset,
  cultureParams,
  onChangeCultureParams,
  totalSpikes,
  totalStims,
  fps,
  onOpenResearch,
  onOpenSettings,
}) => {
  const [audioActive, setAudioActive] = useState<boolean>(globalAudioSynth.getIsEnabled());

  const handleToggleAudio = () => {
    const next = !audioActive;
    globalAudioSynth.setEnabled(next);
    setAudioActive(next);
  };

  const tabs = [
    { id: 'mea-2d', label: '2D MEA Grid', icon: Activity },
    { id: 'mea-3d', label: '3D Spatial View', icon: Layers },
    { id: 'experiments', label: 'Wetware Experiments', icon: Gamepad2, badge: 'Pong • LTP • Maze' },
    { id: 'stim', label: 'Stimulation Workbench', icon: Zap },
    { id: 'analytics', label: 'Neural Analytics', icon: Gauge },
    { id: 'database', label: 'SQL & Datasets', icon: Database, badge: 'MySQL & Excel' },
    { id: 'maze-teaching', label: 'Maze & Pathfinding', icon: Route, badge: 'Algorithms' },
    { id: 'education', label: 'Math Teaching', icon: GraduationCap, badge: 'K → University' },
    { id: 'neurocognitive', label: 'Neurocognitive AI', icon: Cpu, badge: 'Reasoning Nodes' },
    { id: 'code', label: 'Python SDK Runner', icon: Code2 },
    { id: 'legacy-vis', label: 'CL1 Visualizer', icon: ExternalLink },
  ];

  return (
    <header className="border-b border-cyan-950/60 bg-[#090d16]/95 backdrop-blur sticky top-0 z-40 text-slate-100 select-none">
      {/* Top Brand & Status Strip */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center p-1.5 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <img src="/cortical-logo.svg" alt="Cortical Labs" className="h-full w-full object-contain filter invert" onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} />
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white">CORTICAL LABS</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  CL1 Wetware
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online (25 kHz)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Biological Neural Network Simulator & MEA Interface • 64 Microelectrodes
              </p>
            </div>
          </div>
        </div>

        {/* Culture, Audio & Tools */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Research Library Button */}
          <button
            onClick={onOpenResearch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-900/60 to-cyan-950/80 hover:from-blue-800/80 hover:to-cyan-900/90 text-cyan-200 border border-cyan-600/40 shadow-sm transition active:scale-[0.98]"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">Research Library</span>
          </button>

          {/* System Calibration / Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition active:scale-[0.98]"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
            <span>Settings & Menus</span>
          </button>

          {/* Audio Sonification Quick Toggle */}
          <button
            onClick={handleToggleAudio}
            className={`p-1.5 rounded-lg border transition ${
              audioActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={audioActive ? 'Audio Sonification Active (Click to Mute)' : 'Audio Muted (Click to Listen)'}
          >
            {audioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Quick Metrics */}
          <div className="hidden xl:flex items-center gap-3 px-3 py-1 bg-slate-900/80 rounded-md border border-slate-800/80 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Spikes:</span>
              <span className="text-emerald-400 font-semibold">{totalSpikes.toLocaleString()}</span>
            </div>
            <div className="w-px h-3 bg-slate-800"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Stims:</span>
              <span className="text-cyan-400 font-semibold">{totalStims.toLocaleString()}</span>
            </div>
            <div className="w-px h-3 bg-slate-800"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Display:</span>
              <span className="text-amber-400 font-semibold">{fps} FPS</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-md border border-slate-800">
            <button
              onClick={onTogglePause}
              className={`px-2.5 py-1 rounded flex items-center gap-1 font-medium transition ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
              }`}
              title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {/* Speed Multiplier */}
            <div className="flex items-center gap-0.5 px-1">
              {[0.5, 1.0, 2.0, 5.0].map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition ${
                    playbackSpeed === s
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button
              onClick={onReset}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Reset Culture State"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="px-4 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2.5 px-3 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
