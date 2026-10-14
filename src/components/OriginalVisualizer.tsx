import React, { useState } from 'react';
import { ExternalLink, RefreshCw, Maximize2, Info } from 'lucide-react';

export const OriginalVisualizer: React.FC = () => {
  const [iframeKey, setIframeKey] = useState<number>(0);

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenNewTab = () => {
    window.open(`${import.meta.env.BASE_URL}visualiser/index.html`, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-[#080c14] text-slate-100 select-none">
      {/* Top Controls Strip */}
      <div className="px-4 py-2 bg-[#0b101c] border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">
            Cortical Labs Native Web Visualizer (`src/cl/visualisation/web`)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            Embedded /visualiser/index.html
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            className="p-1.5 rounded text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
            title="Reload Iframe"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenNewTab}
            className="px-2.5 py-1 rounded text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-800 flex items-center gap-1.5 hover:bg-cyan-900/60 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Standalone</span>
          </button>
        </div>
      </div>

      {/* Embedded Iframe */}
      <div className="flex-1 w-full bg-black relative">
        <iframe
          key={iframeKey}
          src={`${import.meta.env.BASE_URL}visualiser/index.html`}
          className="w-full h-full border-none block"
          title="Cortical Labs CL1 Native Visualizer"
        />
      </div>
    </div>
  );
};
