import React, { useState, useEffect } from 'react';
import {
  Disc,
  Square,
  Download,
  Clock,
  Activity,
  Zap,
  HardDrive,
  Check,
} from 'lucide-react';
import { NeuralCultureSimulator } from '../simulation/neuralCulture';
import { RecordingSession, TOTAL_CHANNELS } from '../types/cl1';

interface RecordingControllerProps {
  simulator: NeuralCultureSimulator;
}

export const RecordingController: React.FC<RecordingControllerProps> = ({ simulator }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [spikesCaptured, setSpikesCaptured] = useState<number>(0);
  const [stimsCaptured, setStimsCaptured] = useState<number>(0);
  const [savedSessions, setSavedSessions] = useState<RecordingSession[]>([]);
  const [justSaved, setJustSaved] = useState<boolean>(false);

  // Timer while recording
  useEffect(() => {
    let timer: number;
    if (isRecording) {
      timer = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Frame listener to count spikes while recording
  useEffect(() => {
    if (!isRecording) return;

    const unsubscribe = simulator.onFrame((frame) => {
      setSpikesCaptured((prev) => prev + frame.spikes.length);
      setStimsCaptured((prev) => prev + frame.stims.length);
    });

    return () => {
      unsubscribe();
    };
  }, [isRecording, simulator]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(Date.now());
    setElapsedSeconds(0);
    setSpikesCaptured(0);
    setStimsCaptured(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    const duration = elapsedSeconds;

    const session: RecordingSession = {
      id: `CL1_REC_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`,
      startTime: recordingStartTime,
      durationSeconds: duration,
      frameCount: duration * 25000,
      spikeCount: spikesCaptured,
      stimCount: stimsCaptured,
      isRecording: false,
      spikes: [],
      stims: [],
      firingRates: Array.from(simulator.getFiringRates()),
    };

    setSavedSessions((prev) => [session, ...prev]);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const handleDownloadSession = (session: RecordingSession) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${session.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0b101c] p-3.5 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs select-none">
      <div className="flex items-center gap-3">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center ${
            isRecording
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <Disc className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">CL1 HDF5 Session Recorder</span>
            {isRecording && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 font-mono font-semibold animate-pulse">
                REC • {formatTime(elapsedSeconds)}
              </span>
            )}
            {justSaved && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved to History
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {isRecording
              ? `Capturing 25 kHz raw frames • ${spikesCaptured} spikes • ${stimsCaptured} stims`
              : 'Record raw electrophysiological signals, action potentials, and stimulation events'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition active:scale-[0.98]"
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Start Recording</span>
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-600 flex items-center gap-1.5 transition active:scale-[0.98]"
          >
            <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
            <span>Stop & Save Session</span>
          </button>
        )}

        {savedSessions.length > 0 && (
          <button
            onClick={() => handleDownloadSession(savedSessions[0])}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 flex items-center gap-1.5 transition"
            title="Download Latest Recording"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ({savedSessions[0].id.slice(-6)})</span>
          </button>
        )}
      </div>
    </div>
  );
};
