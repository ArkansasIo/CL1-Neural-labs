/**
 * Cortical Labs CL1 Biological Neural Network SDK & MEA Studio
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { BuildIdentity } from './components/BuildIdentity';
import { MeaGrid2D } from './components/MeaGrid2D';
import { Mea3DView } from './components/Mea3DView';
import { ExperimentSuite } from './components/ExperimentSuite';
import { StimulationWorkbench } from './components/StimulationWorkbench';
import { AnalyticsSuite } from './components/AnalyticsSuite';
import { CodePlayground } from './components/CodePlayground';
import { OriginalVisualizer } from './components/OriginalVisualizer';
import { ElectrodeDetailModal } from './components/ElectrodeDetailModal';
import { RecordingController } from './components/RecordingController';
import { ResearchLibraryModal } from './components/ResearchLibraryModal';
import { HardwareSettingsModal } from './components/HardwareSettingsModal';
import { AdvancedSettingsModal } from './components/AdvancedSettingsModal';
import { DatabaseDatasetHub } from './components/DatabaseDatasetHub';
import MazeTeachingTool from './components/MazeTeachingTool';
import EducationTeachingTool from './components/EducationTeachingTool';
import NeuroCognitiveTeachingTool from './components/NeuroCognitiveTeachingTool';
import { NeuralCultureSimulator } from './simulation/neuralCulture';
import { CultureParameters } from './types/cl1';
import { LinuxBootLoader } from './components/LinuxBootLoader';
import { PluginManager } from './plugins/PluginManager';
import { BUILTIN_PLUGINS } from './plugins/builtin';

export default function App() {
  const [booting, setBooting] = useState(true);
  const simulator = useMemo(() => new NeuralCultureSimulator(), []);
  const pluginManager = useMemo(() => {
    const manager = new PluginManager();
    manager.registerMany(BUILTIN_PLUGINS);
    return manager;
  }, []);
  const [activeTab, setActiveTab] = useState<string>('mea-2d');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [cultureParams, setCultureParams] = useState<CultureParameters>(simulator.getCultureParams());
  const [isResearchOpen, setIsResearchOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState<boolean>(false);
  const [totalSpikes, setTotalSpikes] = useState<number>(0);
  const [totalStims, setTotalStims] = useState<number>(0);
  const [fps, setFps] = useState<number>(60);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await pluginManager.initializeAll();
      if (!cancelled) await pluginManager.startAll();
    })().catch((error) => console.error('[CL1] Plugin startup failed', error));
    return () => {
      cancelled = true;
      void pluginManager.stopAll().then(() => pluginManager.disposeAll()).catch((error) => console.error('[CL1] Plugin shutdown failed', error));
    };
  }, [pluginManager]);

  useEffect(() => {
    let animId: number;
    let frameCounter = 0;
    let lastFpsTime = performance.now();
    const loop = (currentTime: number) => {
      if (!isPaused) {
        const frame = simulator.step(20 * playbackSpeed);
        if (frame.spikes.length > 0) setTotalSpikes((prev) => prev + frame.spikes.length);
        if (frame.stims.length > 0) setTotalStims((prev) => prev + frame.stims.length);
      }
      frameCounter++;
      if (currentTime - lastFpsTime >= 1000) {
        setFps(frameCounter);
        frameCounter = 0;
        lastFpsTime = currentTime;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, playbackSpeed, simulator]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.key === '1') setActiveTab('mea-2d');
      else if (e.key === '2') setActiveTab('mea-3d');
      else if (e.key === '3') setActiveTab('experiments');
      else if (e.key === '4') setActiveTab('stim');
      else if (e.key === '5') setActiveTab('analytics');
      else if (e.key === '6') setActiveTab('code');
      else if (e.key === '7') setActiveTab('legacy-vis');
      else if (e.key === 'Escape') {
        setSelectedChannel(null);
        setIsResearchOpen(false);
        setIsSettingsOpen(false);
        setIsAdvancedSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused]);

  const handleTogglePause = () => {
    const next = !isPaused;
    simulator.setPaused(next);
    setIsPaused(next);
  };

  const handleChangeSpeed = (speed: number) => {
    simulator.setPlaybackSpeed(speed);
    setPlaybackSpeed(speed);
  };

  const handleReset = () => {
    simulator.resetCulture();
    setTotalSpikes(0);
    setTotalStims(0);
  };

  const handleChangeCultureParams = (newParams: Partial<CultureParameters>) => {
    simulator.updateCultureParams(newParams);
    setCultureParams(simulator.getCultureParams());
  };

  const handleStimulateChannel = (channel: number) => {
    simulator.stimulate([channel]);
  };

  return (
    <div className="h-screen w-screen bg-[#070b14] text-slate-100 overflow-hidden select-none font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={handleChangeSpeed}
        onReset={handleReset}
        cultureParams={cultureParams}
        onChangeCultureParams={handleChangeCultureParams}
        totalSpikes={totalSpikes}
        totalStims={totalStims}
        fps={fps}
        onOpenResearch={() => setIsResearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdvancedSettings={() => setIsAdvancedSettingsOpen(true)}
      />

      <main className="absolute left-64 top-[61px] right-0 bottom-[69px] overflow-hidden">
        {activeTab === 'mea-2d' && <MeaGrid2D simulator={simulator} onSelectChannel={setSelectedChannel} selectedChannel={selectedChannel} onStimulateChannel={handleStimulateChannel} />}
        {activeTab === 'mea-3d' && <Mea3DView simulator={simulator} onSelectChannel={setSelectedChannel} onStimulateChannel={handleStimulateChannel} />}
        {activeTab === 'experiments' && <ExperimentSuite simulator={simulator} />}
        {activeTab === 'stim' && <StimulationWorkbench simulator={simulator} />}
        {activeTab === 'analytics' && <AnalyticsSuite simulator={simulator} />}
        {activeTab === 'database' && <DatabaseDatasetHub />}
        {activeTab === 'maze-teaching' && <MazeTeachingTool />}
        {activeTab === 'education' && <EducationTeachingTool />}
        {activeTab === 'neurocognitive' && <NeuroCognitiveTeachingTool />}
        {activeTab === 'code' && <CodePlayground simulator={simulator} />}
        {activeTab === 'legacy-vis' && <OriginalVisualizer simulator={simulator} />}
      </main>

      <div className="fixed left-64 right-0 bottom-[45px] border-t border-slate-900 bg-[#070b14] px-4 py-1.5 z-30">
        <BuildIdentity />
      </div>

      <footer className="fixed left-64 right-0 bottom-0 border-t border-slate-800/80 bg-[#090d16] px-4 py-2 z-30">
        <RecordingController simulator={simulator} />
      </footer>

      {selectedChannel !== null && (
        <ElectrodeDetailModal channel={selectedChannel} onClose={() => setSelectedChannel(null)} simulator={simulator} onStimulate={handleStimulateChannel} />
      )}

      {isResearchOpen && <ResearchLibraryModal onClose={() => setIsResearchOpen(false)} />}

      {isSettingsOpen && (
        <HardwareSettingsModal
          onClose={() => setIsSettingsOpen(false)}
          cultureParams={cultureParams}
          onChangeCultureParams={handleChangeCultureParams}
        />
      )}

      {isAdvancedSettingsOpen && <AdvancedSettingsModal onClose={() => setIsAdvancedSettingsOpen(false)} />}

      {booting && <LinuxBootLoader onReady={() => setBooting(false)} />}
    </div>
  );
}