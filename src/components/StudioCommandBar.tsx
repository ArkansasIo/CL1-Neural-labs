import React, { useMemo, useState } from 'react';
import {
  Activity, BookOpen, ChevronDown, Database, FlaskConical, LayoutDashboard,
  Menu, Network, PlayCircle, Settings, ShieldCheck, SlidersHorizontal,
  Terminal, X, Zap
} from 'lucide-react';

type TabId =
  | 'mea-2d' | 'mea-3d' | 'experiments' | 'stim' | 'analytics' | 'database'
  | 'maze-teaching' | 'education' | 'neurocognitive' | 'code' | 'legacy-vis';

type HardwareMode = 'project-simulator' | 'sdk-simulator' | 'replay' | 'physical-read-only';

interface StudioCommandBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
}

const menus: Array<{label: string; icon: React.ElementType; items: Array<{label: string; tab?: TabId; action?: 'settings'; detail: string}>}> = [
  {
    label: 'Workspace',
    icon: LayoutDashboard,
    items: [
      { label: '2D MEA Grid', tab: 'mea-2d', detail: 'Live virtual 64-channel view' },
      { label: '3D Spatial View', tab: 'mea-3d', detail: 'Spatial activity visualization' },
      { label: 'Neural Analytics', tab: 'analytics', detail: 'Analysis and connectivity' },
    ],
  },
  {
    label: 'Experiments',
    icon: FlaskConical,
    items: [
      { label: 'Wetware Experiments', tab: 'experiments', detail: 'Pong, LTP and maze experiments' },
      { label: 'Stimulation Workbench', tab: 'stim', detail: 'Protocol design and authorization gates' },
      { label: 'Maze & Pathfinding', tab: 'maze-teaching', detail: 'Teaching and algorithm experiments' },
    ],
  },
  {
    label: 'Teaching',
    icon: BookOpen,
    items: [
      { label: 'Math Teaching', tab: 'education', detail: 'K–University symbolic curriculum' },
      { label: 'Neurocognitive AI', tab: 'neurocognitive', detail: 'Symbolic reasoning nodes' },
      { label: 'SDK / Code', tab: 'code', detail: 'Python SDK runner and examples' },
    ],
  },
  {
    label: 'Data',
    icon: Database,
    items: [
      { label: 'SQL & Datasets', tab: 'database', detail: 'Database and dataset tools' },
      { label: 'CL1 Visualizer', tab: 'legacy-vis', detail: 'Legacy visualization surface' },
    ],
  },
];

export const StudioCommandBar: React.FC<StudioCommandBarProps> = ({
  activeTab, setActiveTab, onOpenSettings,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [mode, setMode] = useState<HardwareMode>('project-simulator');
  const [layout, setLayout] = useState<'dense' | 'comfortable' | 'wide'>('dense');
  const [autoConnect, setAutoConnect] = useState(false);
  const [readOnly, setReadOnly] = useState(true);
  const [apiBase, setApiBase] = useState('/api');

  const modeLabel = useMemo(() => ({
    'project-simulator': 'Project Simulator',
    'sdk-simulator': 'Official SDK Simulator',
    replay: 'Recording Replay',
    'physical-read-only': 'Physical CL1 • Read Only',
  }[mode]), [mode]);

  const choose = (item: { tab?: TabId; action?: 'settings' }) => {
    if (item.tab) setActiveTab(item.tab);
    if (item.action === 'settings') onOpenSettings();
    setOpenMenu(null);
  };

  return (
    <div className="relative z-50 border-b border-cyan-950/70 bg-[#060a12] text-slate-100">
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto">
        <div className="flex items-center gap-2 pr-2 mr-1 border-r border-slate-800">
          <Menu className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-slate-300">Studio</span>
        </div>

        {menus.map((menu) => {
          const Icon = menu.icon;
          const isOpen = openMenu === menu.label;
          return (
            <div key={menu.label} className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(isOpen ? null : menu.label)}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-expanded={isOpen}
              >
                <Icon className="w-3.5 h-3.5" />
                {menu.label}
                <ChevronDown className="w-3 h-3" />
              </button>
              {isOpen && (
                <div className="absolute left-0 top-full mt-1 w-72 rounded-lg border border-slate-700 bg-[#0b111d] p-1.5 shadow-2xl">
                  {menu.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => choose(item)}
                      className="block w-full rounded-md px-3 py-2 text-left hover:bg-cyan-950/50"
                    >
                      <div className="text-xs font-semibold text-slate-100">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.detail}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden md:flex items-center gap-1 rounded-md border border-emerald-900/60 bg-emerald-950/20 px-2 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-300">{modeLabel}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickSettings((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs hover:bg-slate-800"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Options
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-md border border-cyan-800/70 bg-cyan-950/30 px-2.5 py-1.5 text-xs text-cyan-200 hover:bg-cyan-900/40"
          >
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
        </div>
      </div>

      {showQuickSettings && (
        <div className="border-t border-slate-800 bg-[#080d17] px-4 py-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-[11px] text-slate-400">
              Hardware environment
              <select value={mode} onChange={(e) => setMode(e.target.value as HardwareMode)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100">
                <option value="project-simulator">Project Simulator</option>
                <option value="sdk-simulator">Official SDK Simulator</option>
                <option value="replay">Recording Replay</option>
                <option value="physical-read-only">Physical CL1 • Read Only</option>
              </select>
            </label>
            <label className="text-[11px] text-slate-400">
              Layout
              <select value={layout} onChange={(e) => setLayout(e.target.value as typeof layout)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100">
                <option value="dense">Dense Command Center</option>
                <option value="comfortable">Comfortable</option>
                <option value="wide">Wide / Analysis</option>
              </select>
            </label>
            <label className="text-[11px] text-slate-400">
              API base URL
              <input value={apiBase} onChange={(e) => setApiBase(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100" />
            </label>
            <div className="flex flex-col justify-end gap-2 text-[11px]">
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked={autoConnect} onChange={(e) => setAutoConnect(e.target.checked)} />
                Auto-connect on startup
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} />
                Physical integration read-only
              </label>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-2">
            <span className="flex items-center gap-1 text-[10px] text-slate-500"><Network className="w-3 h-3" /> API: {apiBase}</span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500"><Activity className="w-3 h-3" /> Mode changes are session-local</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400"><ShieldCheck className="w-3 h-3" /> Stimulation remains separately gated</span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500"><Terminal className="w-3 h-3" /> {layout}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 border-t border-slate-900 px-3 py-1 overflow-x-auto">
        <PlayCircle className="w-3.5 h-3.5 text-cyan-500 mr-1" />
        <span className="text-[10px] uppercase tracking-wider text-slate-600 mr-2">Active</span>
        <button onClick={() => setActiveTab(activeTab)} className="rounded px-2 py-1 text-[11px] text-cyan-300 bg-cyan-950/30">
          {activeTab}
        </button>
        <span className="text-slate-700">•</span>
        <span className="text-[10px] text-slate-500">GUI · API · Settings · Options · Forms · Layouts</span>
      </div>
    </div>
  );
};
