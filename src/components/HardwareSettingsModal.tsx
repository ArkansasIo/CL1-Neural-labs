import React, { useState } from 'react';
import {
  Settings,
  Dna,
  Cpu,
  Sliders,
  ShieldCheck,
  Droplets,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Check,
  Flame,
} from 'lucide-react';
import { CultureParameters } from '../types/cl1';
import { globalAudioSynth } from '../simulation/audioSynth';

interface HardwareSettingsModalProps {
  onClose: () => void;
  cultureParams: CultureParameters;
  onChangeCultureParams: (params: Partial<CultureParameters>) => void;
}

export const HardwareSettingsModal: React.FC<HardwareSettingsModalProps> = ({
  onClose,
  cultureParams,
  onChangeCultureParams,
}) => {
  const [activeSubMenu, setActiveSubMenu] = useState<'culture' | 'hardware' | 'dsp' | 'safety' | 'fluidics' | 'audio'>('culture');

  // DSP Filter state
  const [highpassHz, setHighpassHz] = useState<number>(300);
  const [lowpassHz, setLowpassHz] = useState<number>(3000);
  const [notch50Hz, setNotch50Hz] = useState<boolean>(true);
  const [notch60Hz, setNotch60Hz] = useState<boolean>(false);
  const [blankingUs, setBlankingUs] = useState<number>(2000);
  const [spikeThresholdSigma, setSpikeThresholdSigma] = useState<number>(-5.0);

  // Audio State
  const [audioEnabled, setAudioEnabled] = useState<boolean>(globalAudioSynth.getIsEnabled());
  const [audioVolume, setAudioVolume] = useState<number>(globalAudioSynth.getVolume());

  // Hardware state
  const [electrodeMaterial, setElectrodeMaterial] = useState<string>('Titanium Nitride (TiN)');
  const [targetTemp, setTargetTemp] = useState<number>(37.0);
  const [targetCo2, setTargetCo2] = useState<number>(5.0);
  const [flowRateMlMin, setFlowRateMlMin] = useState<number>(0.15);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    globalAudioSynth.setEnabled(next);
    setAudioEnabled(next);
  };

  const handleAudioVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    globalAudioSynth.setVolume(vol);
  };

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-[#0b101c] border border-cyan-500/30 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">CL1 System Configuration & Wetware Calibration</h2>
              <p className="text-xs text-slate-400">
                Adjust biological culture parameters, MEA hardware transducer, DSP filtering, and fluidics.
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

        {/* Submenu Sidebar & Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Submenu Sidebar */}
          <div className="w-56 bg-[#090e19] border-r border-slate-800 p-3 space-y-1 text-xs">
            {[
              { id: 'culture', label: '1. Biological Wetware', icon: Dna },
              { id: 'hardware', label: '2. MEA Transducer', icon: Cpu },
              { id: 'dsp', label: '3. DSP & Filtering', icon: Sliders },
              { id: 'safety', label: '4. Stimulation Safety', icon: ShieldCheck },
              { id: 'fluidics', label: '5. Incubation & Fluids', icon: Droplets },
              { id: 'audio', label: '6. Audio Sonification', icon: Volume2 },
            ].map((menu) => {
              const Icon = menu.icon;
              const isActive = activeSubMenu === menu.id;
              return (
                <button
                  key={menu.id}
                  onClick={() => setActiveSubMenu(menu.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium transition text-left ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{menu.label}</span>
                </button>
              );
            })}
          </div>

          {/* Submenu Content Panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* 1. CULTURE & BIOLOGICAL */}
            {activeSubMenu === 'culture' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Dna className="w-4 h-4 text-cyan-400" />
                  Biological Monolayer Culture Parameters
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-slate-300 block mb-1">Neuron Cell Species / Lineage</label>
                    <select
                      value={cultureParams.cellType}
                      onChange={(e) => onChangeCultureParams({ cellType: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-cyan-300 font-mono text-xs focus:outline-none"
                    >
                      <option value="Human iPSC Cortical">Homo sapiens (Human iPSC-derived Cortical Neurons)</option>
                      <option value="Mouse Embryonic Cortical">Mus musculus (Primary Mouse Embryonic Cortical E18)</option>
                      <option value="Mixed Cortical/Hippocampal">Mixed Cortical/Hippocampal Co-Culture</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Spontaneous Firing Rate:</span>
                      <span className="font-mono text-emerald-400 font-bold">{cultureParams.spontaneousRateHz.toFixed(1)} Hz / Channel</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="15.0"
                      step="0.5"
                      value={cultureParams.spontaneousRateHz}
                      onChange={(e) => onChangeCultureParams({ spontaneousRateHz: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-700 rounded-lg accent-emerald-400"
                    />
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Burst Synchrony Factor:</span>
                      <span className="font-mono text-purple-400 font-bold">{(cultureParams.burstSynchrony * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={cultureParams.burstSynchrony}
                      onChange={(e) => onChangeCultureParams({ burstSynchrony: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-700 rounded-lg accent-purple-400"
                    />
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-200 font-semibold block">Hebbian Synaptic Plasticity (STDP)</span>
                      <span className="text-[11px] text-slate-400">Enables dynamic LTP/LTD weight adaptation during stimulation</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={cultureParams.synapticPlasticity}
                      onChange={(e) => onChangeCultureParams({ synapticPlasticity: e.target.checked })}
                      className="w-4 h-4 accent-cyan-400 rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. MEA TRANSDUCER */}
            {activeSubMenu === 'hardware' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Microelectrode Array (MEA) Transducer Specifications
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Electrode Layout</span>
                    <span className="text-sm font-bold text-cyan-300 font-mono">8×8 Square (64 Channels)</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Electrode Pitch</span>
                    <span className="text-sm font-bold text-cyan-300 font-mono">200 μm center-to-center</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Microelectrode Material</label>
                  <select
                    value={electrodeMaterial}
                    onChange={(e) => setElectrodeMaterial(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-cyan-300 font-mono text-xs focus:outline-none"
                  >
                    <option value="Titanium Nitride (TiN)">Titanium Nitride (TiN) - Standard CL1 High-Capacitance</option>
                    <option value="Platinum Black">Platinum Black - Low Impedance (~150 kΩ)</option>
                    <option value="PEDOT:PSS Polymer">PEDOT:PSS Conducting Polymer</option>
                    <option value="Gold Electroplated">Gold (Au) Electroplated Pads</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-1 text-slate-400">
                  <span className="font-semibold text-slate-300 block">Pinout Hardwiring:</span>
                  <p className="text-[11px]">
                    Channels 0, 7, 56, 63: Tied directly to analog reference ground (⏚ GND).<br />
                    Channel 4: Hardware internal reference electrode (REF).
                  </p>
                </div>
              </div>
            )}

            {/* 3. DSP & FILTERING */}
            {activeSubMenu === 'dsp' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Digital Signal Processing (DSP) & Spike Detection
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">High-pass Cutoff:</span>
                      <span className="font-mono text-cyan-400">{highpassHz} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="500"
                      step="25"
                      value={highpassHz}
                      onChange={(e) => setHighpassHz(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded accent-cyan-400"
                    />
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Low-pass Cutoff:</span>
                      <span className="font-mono text-cyan-400">{lowpassHz} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="6000"
                      step="250"
                      value={lowpassHz}
                      onChange={(e) => setLowpassHz(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Spike Detection Threshold:</span>
                    <span className="font-mono text-emerald-400 font-bold">{spikeThresholdSigma.toFixed(1)} × σ (Noise RMS)</span>
                  </div>
                  <input
                    type="range"
                    min="-7.0"
                    max="-3.5"
                    step="0.5"
                    value={spikeThresholdSigma}
                    onChange={(e) => setSpikeThresholdSigma(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded accent-emerald-400"
                  />
                </div>

                <div className="flex gap-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notch50Hz}
                      onChange={(e) => setNotch50Hz(e.target.checked)}
                      className="accent-cyan-400 rounded"
                    />
                    <span>50 Hz Mains Notch Filter</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notch60Hz}
                      onChange={(e) => setNotch60Hz(e.target.checked)}
                      className="accent-cyan-400 rounded"
                    />
                    <span>60 Hz Mains Notch Filter</span>
                  </label>
                </div>
              </div>
            )}

            {/* 4. STIMULATION SAFETY */}
            {activeSubMenu === 'safety' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Hardware Safety Interlocks & Tissue Protection
                </h3>

                <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2">
                  <span className="font-bold text-emerald-300 block">Cortical Labs Charge Ceiling: 3,000 pC</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Passing electrical current through biological tissue can induce Faradaic hydrolysis, electrode dissolution, and cellular electroporation. The CL1 system strictly clamps current to ±3.0 μA and total pulse charge to 3.0 nC.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[11px] block">Max Current Limit</span>
                    <span className="text-cyan-300 font-bold">±3.00 μA (Hardware Clamped)</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[11px] block">Min Pulse Resolution</span>
                    <span className="text-cyan-300 font-bold">20 μs Discrete Time Step</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. FLUIDICS & INCUBATION */}
            {activeSubMenu === 'fluidics' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  Fluidics, Perfusion & Incubation Chamber
                </h3>

                <div className="grid grid-cols-3 gap-3 font-mono">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[11px] block">Temperature</span>
                    <span className="text-amber-400 font-bold text-sm">{targetTemp.toFixed(1)}°C (Nominal)</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[11px] block">CO₂ Concentration</span>
                    <span className="text-cyan-300 font-bold text-sm">{targetCo2.toFixed(1)}% (Humidified)</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[11px] block">Perfusion Flow</span>
                    <span className="text-emerald-400 font-bold text-sm">{flowRateMlMin} mL/min</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-900">
                  Microfluidic pumps continuously circulate oxygenated BrainPhys Neuronal Medium across the 8×8 MEA chamber, maintaining stable osmotic pressure (305 mOsm) and neutral physiological pH (7.35).
                </p>
              </div>
            )}

            {/* 6. AUDIO SONIFICATION */}
            {activeSubMenu === 'audio' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  Bio-Electrophysiology Audio Monitor (Web Audio)
                </h3>

                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-200 font-semibold block">Enable Electrophysiology Audio</span>
                    <span className="text-[11px] text-slate-400">
                      Audibly sonify action potential spike discharges and electrical stimulation pulses in real time.
                    </span>
                  </div>
                  <button
                    onClick={handleToggleAudio}
                    className={`p-2.5 rounded-xl border transition flex items-center gap-2 ${
                      audioEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span>{audioEnabled ? 'Audio Active' : 'Muted'}</span>
                  </button>
                </div>

                {audioEnabled && (
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Master Audio Volume:</span>
                      <span className="font-mono text-cyan-400 font-bold">{(audioVolume * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={audioVolume}
                      onChange={(e) => handleAudioVolumeChange(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded accent-cyan-400"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">CL1 System Firmware: v2.4.1-rc3</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{savedSuccess ? 'Settings Applied' : 'Apply Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
