import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, BookOpen, Settings, SlidersHorizontal } from 'lucide-react';
import { CultureParameters } from '../types/cl1';
import { globalAudioSynth } from '../simulation/audioSynth';
import { LeftSidebar } from './LeftSidebar';

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
  onOpenAdvancedSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isPaused,
  onTogglePause,
  playbackSpeed,
  onChangeSpeed,
  onReset,
  totalSpikes,
  totalStims,
  fps,
  onOpenResearch,
  onOpenSettings,
  onOpenAdvancedSettings,
}) => {
  const [audioActive, setAudioActive] = useState<boolean>(globalAudioSynth.getIsEnabled());

  const handleToggleAudio = () => {
    const next = !audioActive;
    globalAudioSynth.setEnabled(next);
    setAudioActive(next);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-[61px] border-b border-cyan-950/60 bg-[#090d16]/98 backdrop-blur-xl text-slate-100 select-none">
        <div className="h-full px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center p-1.5 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <img src="/branding/cl1-neural-labs-logo.svg" alt="CL1 Neural Labs" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white">CL1 NEURAL LABS</span>
                <span className="hidden sm:inline text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">Research Studio</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> SIM ONLINE</span>
                <span>64-CHANNEL MEA</span>
                <span className="hidden md:inline">25 kHz reference</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-slate-900/80 rounded-md border border-slate-800 font-mono">
              <span className="text-slate-500">SPIKES <b className="text-emerald-400">{totalSpikes.toLocaleString()}</b></span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-500">STIMS <b className="text-cyan-400">{totalStims.toLocaleString()}</b></span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-500">FPS <b className="text-amber-400">{fps}</b></span>
            </div>
            <button onClick={onOpenResearch} className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-800 transition"><BookOpen className="w-3.5 h-3.5" /> Research</button>
            <button onClick={onOpenSettings} className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 transition"><Settings className="w-3.5 h-3.5" /> Hardware</button>
            <button onClick={onOpenAdvancedSettings} className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-800 transition"><SlidersHorizontal className="w-3.5 h-3.5" /> Advanced</button>
            <button onClick={handleToggleAudio} title={audioActive ? 'Mute sonification' : 'Enable sonification'} className={`p-1.5 rounded-md border transition ${audioActive ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
              {audioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-md border border-slate-800">
              <button onClick={onTogglePause} className={`px-2 py-1 rounded flex items-center gap-1 transition ${isPaused ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              {[0.5, 1, 2, 5].map((s) => <button key={s} onClick={() => onChangeSpeed(s)} className={`px-1.5 py-1 rounded text-[10px] font-mono ${playbackSpeed === s ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-200'}`}>{s}x</button>)}
              <button onClick={onReset} title="Reset culture state" className="p-1 text-slate-500 hover:text-slate-200"><RotateCcw className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      </header>
      <LeftSidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenResearch={onOpenResearch} onOpenSettings={onOpenSettings} />
    </>
  );
};