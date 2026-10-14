import React, { useEffect, useRef, useState } from 'react';
import { BUILD_INFO } from '../config/buildInfo';

const STAGES: readonly [string,string,string][] = [
  ['[  OK  ]', 'CORE SYSTEM', 'initializing neural-lab runtime'],
  ['[  OK  ]', 'BUILD IDENTITY', BUILD_INFO.buildId],
  ['[  OK  ]', 'VIRTUAL HARDWARE', 'project-simulator / 64-channel MEA'],
  ['[  OK  ]', 'DATA PIPELINE', 'simulation + replay services'],
  ['[  OK  ]', 'GUI / API', 'API ' + BUILD_INFO.apiVersion],
  ['[  OK  ]', 'SAFETY GATES', 'physical stimulation remains locked'],
];

export const LinuxBootLoader: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  const [visible, setVisible] = useState(0);
  // Keep the latest callback in a ref so parent re-renders (e.g. the live
  // simulation ticking) don't restart the boot timers and stall the loader.
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  useEffect(() => {
    const timer = window.setInterval(() => setVisible(v => Math.min(v + 1, STAGES.length)), 180);
    const done = window.setTimeout(() => onReadyRef.current(), 1450);
    return () => { window.clearInterval(timer); window.clearTimeout(done); };
  }, []);

  return <div className="fixed inset-0 z-[100] bg-[#03060b] text-slate-300 font-mono p-6 md:p-10 flex items-center justify-center">
    <div className="w-full max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <img src="/branding/cl1-neural-labs-logo.svg" alt="CL1 Neural Labs" className="h-16 w-16" />
        <div><div className="text-cyan-300 text-xl font-bold">CL1 NEURAL LABS</div><div className="text-slate-500 text-xs">research operating environment / neural computation studio</div></div>
      </div>
      <div className="border-y border-slate-800 py-4 text-xs leading-6">
        <div className="text-slate-500">ArkansasIo Linux-style bootstrap console</div>
        {STAGES.slice(0, visible).map(([status, name, detail]) => <div key={name}><span className="text-emerald-400">{status}</span> <span className="text-slate-200">{name}</span> <span className="text-slate-600">—</span> <span className="text-slate-400">{detail}</span></div>)}
        {visible < STAGES.length && <div className="text-cyan-400 animate-pulse">[ .... ] starting subsystem {visible + 1}/{STAGES.length}</div>}
      </div>
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] uppercase tracking-wider">
        <div className="border border-slate-800 p-2"><span className="text-slate-500">Version</span><div className="text-slate-200">{BUILD_INFO.version}</div></div>
        <div className="border border-slate-800 p-2"><span className="text-slate-500">Build</span><div className="text-slate-200">{BUILD_INFO.buildId}</div></div>
        <div className="border border-slate-800 p-2"><span className="text-slate-500">Mode</span><div className="text-emerald-300">PROJECT-SIMULATOR</div></div>
        <div className="border border-slate-800 p-2"><span className="text-slate-500">Physical I/O</span><div className="text-amber-300">LOCKED</div></div>
      </div>
      <div className="mt-6 text-[10px] text-slate-600">Application boot UI only. Physical CL1 access requires a separate validated adapter and explicit authorization.</div>
    </div>
  </div>;
};
