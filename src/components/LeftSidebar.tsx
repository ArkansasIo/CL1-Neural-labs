import React, { useState } from 'react';
import {
  Activity, BrainCircuit, ChevronDown, ChevronRight, Database, FlaskConical,
  Gauge, GraduationCap, Layers3, Microscope, Route, Settings, Sliders,
  Sparkles, TerminalSquare, Waves, BarChart3, BookOpen
} from 'lucide-react';

interface LeftSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenResearch: () => void;
  onOpenSettings: () => void;
}

type MenuGroup = {
  id: string;
  label: string;
  icon: React.ElementType;
  items: { id: string; label: string; icon: React.ElementType; badge?: string }[];
};

const GROUPS: MenuGroup[] = [
  {
    id: 'lab',
    label: 'Core Neural Lab',
    icon: Microscope,
    items: [
      { id: 'mea-2d', label: 'MEA 2D Monitor', icon: Activity, badge: '64ch' },
      { id: 'mea-3d', label: '3D Spatial View', icon: Layers3 },
      { id: 'legacy-vis', label: 'Signal Visualizer', icon: Waves },
    ],
  },
  {
    id: 'experiments',
    label: 'Experiments',
    icon: FlaskConical,
    items: [
      { id: 'experiments', label: 'Experiment Suite', icon: FlaskConical },
      { id: 'stim', label: 'Stimulation Workbench', icon: Sliders },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis & Recording',
    icon: BarChart3,
    items: [
      { id: 'analytics', label: 'Neural Analytics', icon: Gauge },
      { id: 'recording', label: 'Recording & Playback', icon: Waves, badge: 'Session' },
    ],
  },
  {
    id: 'data',
    label: 'Data & Research',
    icon: Database,
    items: [
      { id: 'database', label: 'SQL & Datasets', icon: Database },
      { id: 'research', label: 'Research Library', icon: BookOpen },
    ],
  },
  {
    id: 'teaching',
    label: 'Teaching Lab',
    icon: GraduationCap,
    items: [
      { id: 'maze-teaching', label: 'Maze & Pathfinding', icon: Route },
      { id: 'education', label: 'Math Teaching', icon: GraduationCap, badge: 'K→Uni' },
      { id: 'neurocognitive', label: 'Neurocognitive AI', icon: BrainCircuit },
    ],
  },
  {
    id: 'developer',
    label: 'Developer & SDK',
    icon: TerminalSquare,
    items: [
      { id: 'code', label: 'Python SDK Runner', icon: TerminalSquare },
    ],
  },
];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenResearch,
  onOpenSettings,
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    lab: false,
    experiments: false,
    analysis: false,
    data: false,
    teaching: false,
    developer: true,
  });

  const toggle = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside className="fixed left-0 top-[61px] bottom-[69px] z-40 w-64 border-r border-slate-800/90 bg-[#080d17]/98 backdrop-blur-xl overflow-y-auto">
      <div className="px-3 py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 px-2">
          <div className="h-7 w-7 rounded-md bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-[0.18em] text-slate-200">LAB CONTROL</div>
            <div className="text-[10px] text-slate-500">CL1 / 64-CHANNEL MEA</div>
          </div>
        </div>
      </div>

      <nav className="p-2 space-y-1">
        {GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const isCollapsed = collapsed[group.id];
          const containsActive = group.items.some((item) => item.id === activeTab);

          return (
            <div key={group.id} className="rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(group.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 text-[11px] uppercase tracking-wider font-semibold transition ${
                  containsActive
                    ? 'text-cyan-300 bg-cyan-950/35'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                }`}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <GroupIcon className={`w-3.5 h-3.5 ${containsActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="flex-1 text-left">{group.label}</span>
                {containsActive && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
              </button>

              {!isCollapsed && (
                <div className="ml-3 pl-2 border-l border-slate-800/80 space-y-0.5 py-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === 'research') {
                            onOpenResearch();
                            return;
                          }
                          if (item.id === 'recording') {
                            setActiveTab('mea-2d');
                            return;
                          }
                          setActiveTab(item.id);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition ${
                          active
                            ? 'bg-cyan-500/12 text-cyan-200 border border-cyan-500/25'
                            : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-2 mt-1 border-t border-slate-800/80">
        <button
          onClick={onOpenResearch}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30 transition"
        >
          <BookOpen className="w-4 h-4" />
          <span>Research & Documentation</span>
        </button>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
        >
          <Settings className="w-4 h-4" />
          <span>Hardware & Calibration</span>
        </button>
        <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-slate-600">
          <Sparkles className="w-3 h-3" />
          <span>Research build • synthetic simulator</span>
        </div>
      </div>
    </aside>
  );
};
