import React, { useState } from 'react';
import { Gamepad2, Brain, Compass, Sparkles } from 'lucide-react';
import { NeuralCultureSimulator } from '../simulation/neuralCulture';
import { DishBrainPong } from './DishBrainPong';
import { AssociativeConditioningView } from './AssociativeConditioningView';
import { MazeNavigationView } from './MazeNavigationView';

interface ExperimentSuiteProps {
  simulator: NeuralCultureSimulator;
}

export const ExperimentSuite: React.FC<ExperimentSuiteProps> = ({ simulator }) => {
  const [currentExp, setCurrentExp] = useState<'pong' | 'conditioning' | 'maze'>('pong');

  const experiments = [
    {
      id: 'pong',
      title: '1. DishBrain Biological Pong',
      subtitle: 'Kagan et al. (Neuron, 2022)',
      description: 'Living neural culture embodied in a simulated Pong arcade world via Free Energy Principle feedback.',
      icon: Gamepad2,
      tag: 'Classic',
    },
    {
      id: 'conditioning',
      title: '2. Associative Conditioning (LTP)',
      subtitle: 'Hebbian Plasticity & STDP',
      description: 'Pairing Conditioned Stimulus (CS) with Unconditioned Stimulus (US) to strengthen neural pathways.',
      icon: Brain,
      tag: 'Plasticity',
    },
    {
      id: 'maze',
      title: '3. Spatial Maze Navigation',
      subtitle: 'Goal-Directed Pathfinding',
      description: 'In vitro neural agent exploring a 2D spatial grid navigating toward a target goal via sensory feedback.',
      icon: Compass,
      tag: 'Navigation',
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#080c14] text-slate-100 select-none overflow-hidden">
      {/* Top Experiment Selector Bar */}
      <div className="px-4 py-2.5 bg-[#0b111e] border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mr-2">
            Wetware Experiment:
          </span>
          {experiments.map((exp) => {
            const Icon = exp.icon;
            const isActive = currentExp === exp.id;
            return (
              <button
                key={exp.id}
                onClick={() => setCurrentExp(exp.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{exp.title}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  {exp.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Experiment Body */}
      <div className="flex-1 overflow-hidden">
        {currentExp === 'pong' && <DishBrainPong simulator={simulator} />}
        {currentExp === 'conditioning' && <AssociativeConditioningView simulator={simulator} />}
        {currentExp === 'maze' && <MazeNavigationView simulator={simulator} />}
      </div>
    </div>
  );
};
