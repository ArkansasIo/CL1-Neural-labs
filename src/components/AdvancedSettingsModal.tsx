import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Layers3, RotateCcw, Settings2, ToggleLeft, X } from 'lucide-react';
import {
  DEFAULT_LAB_SETTINGS,
  DEFAULT_MODULE_STATES,
  LAB_MODULES,
  LAB_SETTINGS_STORAGE_KEY,
} from '../config/labSettings';

type SettingValue = boolean | number | string;

interface PersistedSettings {
  values: Record<string, SettingValue>;
  modules: Record<string, boolean>;
}

interface AdvancedSettingsModalProps {
  onClose: () => void;
}

const loadSettings = (): PersistedSettings => {
  try {
    const raw = localStorage.getItem(LAB_SETTINGS_STORAGE_KEY);
    if (!raw) return { values: { ...DEFAULT_LAB_SETTINGS }, modules: { ...DEFAULT_MODULE_STATES } };
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      values: { ...DEFAULT_LAB_SETTINGS, ...(parsed.values ?? {}) },
      modules: { ...DEFAULT_MODULE_STATES, ...(parsed.modules ?? {}) },
    };
  } catch {
    return { values: { ...DEFAULT_LAB_SETTINGS }, modules: { ...DEFAULT_MODULE_STATES } };
  }
};

export const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({ onClose }) => {
  const initial = useMemo(loadSettings, []);
  const [activeModule, setActiveModule] = useState(LAB_MODULES[0].id);
  const [values, setValues] = useState<Record<string, SettingValue>>(initial.values);
  const [modules, setModules] = useState<Record<string, boolean>>(initial.modules);
  const [saved, setSaved] = useState(false);

  const currentModule = LAB_MODULES.find((module) => module.id === activeModule) ?? LAB_MODULES[0];

  useEffect(() => {
    localStorage.setItem(LAB_SETTINGS_STORAGE_KEY, JSON.stringify({ values, modules }));
  }, [values, modules]);

  const updateValue = (id: string, value: SettingValue) => {
    setValues((previous) => ({ ...previous, [id]: value }));
    setSaved(false);
  };

  const resetAll = () => {
    setValues({ ...DEFAULT_LAB_SETTINGS });
    setModules({ ...DEFAULT_MODULE_STATES });
    setSaved(false);
  };

  const save = () => {
    localStorage.setItem(LAB_SETTINGS_STORAGE_KEY, JSON.stringify({ values, modules }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-[#0b101c] border border-cyan-500/30 rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Advanced Lab Settings</h2>
              <p className="text-xs text-slate-400">Modules, switches, runtime options, data services, and developer controls.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-64 bg-[#090e19] border-r border-slate-800 p-3 overflow-y-auto">
            <div className="text-[10px] uppercase tracking-widest text-slate-600 px-3 py-2">Modules</div>
            <div className="space-y-1">
              {LAB_MODULES.map((module) => {
                const enabled = modules[module.id];
                const active = module.id === activeModule;
                return (
                  <div key={module.id} className={`rounded-lg border ${active ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-transparent'}`}>
                    <button onClick={() => setActiveModule(module.id)} className="w-full text-left px-3 py-2.5 flex items-center gap-2">
                      <Layers3 className={`w-4 h-4 ${enabled ? 'text-cyan-300' : 'text-slate-600'}`} />
                      <span className="flex-1 text-xs font-medium">{module.label}</span>
                      <span className={`text-[9px] uppercase ${enabled ? 'text-emerald-400' : 'text-slate-600'}`}>{enabled ? 'ON' : 'OFF'}</span>
                    </button>
                    <div className="px-3 pb-2">
                      <button
                        onClick={() => setModules((previous) => ({ ...previous, [module.id]: !enabled }))}
                        className={`w-full rounded border px-2 py-1.5 text-[10px] flex items-center justify-center gap-1.5 ${enabled ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 bg-slate-950 text-slate-500'}`}
                      >
                        <ToggleLeft className="w-3.5 h-3.5" /> Module switch
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="flex-1 overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{currentModule.label}</h3>
                <p className="text-xs text-slate-500 mt-1">{currentModule.description}</p>
              </div>
              <span className={`px-2 py-1 rounded text-[9px] font-bold border ${modules[currentModule.id] ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-800 bg-slate-950'}`}>
                {modules[currentModule.id] ? 'MODULE ENABLED' : 'MODULE DISABLED'}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {currentModule.settings.map((setting) => {
                const value = values[setting.id];
                return (
                  <div key={setting.id} className="p-4 bg-slate-900/70 rounded-xl border border-slate-800">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{setting.label}</div>
                        <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">{setting.description}</div>
                      </div>
                      {setting.kind === 'toggle' && (
                        <button
                          aria-label={`${setting.label} switch`}
                          onClick={() => updateValue(setting.id, !Boolean(value))}
                          className={`relative w-11 h-6 rounded-full border transition ${Boolean(value) ? 'bg-cyan-500/30 border-cyan-400/50' : 'bg-slate-950 border-slate-700'}`}
                        >
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full transition ${Boolean(value) ? 'left-[21px] bg-cyan-300' : 'left-0.5 bg-slate-600'}`} />
                        </button>
                      )}
                    </div>
                    {setting.kind === 'select' && (
                      <div className="relative mt-3">
                        <select value={String(value)} onChange={(e) => updateValue(setting.id, e.target.value)} className="w-full appearance-none p-2.5 pr-8 bg-slate-950 border border-slate-800 rounded-lg text-xs text-cyan-300 focus:outline-none">
                          {setting.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-3 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
                      </div>
                    )}
                    {setting.kind === 'number' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1"><span>{setting.min}</span><span className="text-cyan-300">{Number(value).toFixed(2)}</span><span>{setting.max}</span></div>
                        <input type="range" min={setting.min} max={setting.max} step={setting.step} value={Number(value)} onChange={(e) => updateValue(setting.id, Number(e.target.value))} className="w-full accent-cyan-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!modules[currentModule.id] && <div className="mt-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[11px] text-amber-300">This module is switched off. Its configuration is retained but should not be consumed by runtime components.</div>}
          </section>
        </div>

        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button onClick={resetAll} className="px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5" /> Reset defaults</button>
          <div className="flex items-center gap-2">
            {saved && <span className="text-[10px] text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Saved locally</span>}
            <button onClick={onClose} className="px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white">Close</button>
            <button onClick={save} className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-xs text-cyan-200 hover:bg-cyan-500/30">Apply settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};
