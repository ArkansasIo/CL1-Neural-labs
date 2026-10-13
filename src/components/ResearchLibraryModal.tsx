import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ExternalLink,
  Cpu,
  Dna,
  Layers,
  FileText,
  Copy,
  Check,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { RESEARCH_ARTICLES, CULTURE_PROFILES } from '../data/researchDatabase';
import { ScientificArticle, BiologicalCultureProfile } from '../types/cl1Research';

interface ResearchLibraryModalProps {
  onClose: () => void;
}

export const ResearchLibraryModal: React.FC<ResearchLibraryModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'articles' | 'cultures' | 'contracts'>('articles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<ScientificArticle>(RESEARCH_ARTICLES[0]);
  const [selectedCulture, setSelectedCulture] = useState<BiologicalCultureProfile>(CULTURE_PROFILES[0]);
  const [copiedDoi, setCopiedDoi] = useState<string | null>(null);

  const filteredArticles = RESEARCH_ARTICLES.filter((art) => {
    const q = searchQuery.toLowerCase();
    return (
      art.title.toLowerCase().includes(q) ||
      art.authors.some((a) => a.toLowerCase().includes(q)) ||
      art.journal.toLowerCase().includes(q) ||
      art.abstract.toLowerCase().includes(q)
    );
  });

  const handleCopyCitation = (doi: string) => {
    navigator.clipboard.writeText(`https://doi.org/${doi}`);
    setCopiedDoi(doi);
    setTimeout(() => setCopiedDoi(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-[#0b101c] border border-cyan-500/30 rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">CL1 Scientific Research & Wetware Compendium</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                  Peer-Reviewed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official literature, Kagan et al. DishBrain publications, Free Energy Principle neurophysics, and cell profiles.
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

        {/* Navigation Tabs & Search */}
        <div className="px-6 py-2.5 bg-[#090e19] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('articles')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                activeTab === 'articles'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Scientific Articles ({RESEARCH_ARTICLES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('cultures')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                activeTab === 'cultures'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              <span>Human & Rodent Culture Profiles ({CULTURE_PROFILES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                activeTab === 'contracts'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>CL1 Architecture & Schematics</span>
            </button>
          </div>

          {activeTab === 'articles' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search papers, authors, DOI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 w-56"
              />
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'articles' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Paper Selector List (4 cols) */}
              <div className="md:col-span-4 space-y-2.5 overflow-y-auto max-h-[60vh] pr-1">
                {filteredArticles.map((art) => (
                  <button
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1.5 ${
                      selectedArticle.id === art.id
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug">
                      {art.title}
                    </span>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{art.journal}</span>
                      <span className="text-cyan-400">{art.year}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Paper Detail View (8 cols) */}
              <div className="md:col-span-8 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">{selectedArticle.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedArticle.authors.join(', ')} •{' '}
                    <strong className="text-cyan-400">{selectedArticle.journal} ({selectedArticle.year})</strong>
                  </p>
                </div>

                {/* DOI & Citation Row */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">DOI:</span>
                    <a
                      href={`https://doi.org/${selectedArticle.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {selectedArticle.doi}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <button
                    onClick={() => handleCopyCitation(selectedArticle.doi)}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition"
                  >
                    {copiedDoi === selectedArticle.doi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDoi === selectedArticle.doi ? 'Copied Link' : 'Copy DOI'}</span>
                  </button>
                </div>

                {/* Abstract */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Abstract
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#070b14] p-3.5 rounded-xl border border-slate-900">
                    {selectedArticle.abstract}
                  </p>
                </div>

                {/* Core Findings */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Core Findings & Contributions
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedArticle.coreKeypoints.map((kp, i) => (
                      <li key={i} className="flex items-start gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Free Energy Principle & Neurophysics */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Active Inference & FEP Mechanics
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedArticle.fepPrinciples.map((fep, i) => (
                      <div key={i} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-900/80 text-slate-300">
                        {fep}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cultures' && (
            <div className="space-y-6">
              {/* Culture Selector Bar */}
              <div className="flex gap-3">
                {CULTURE_PROFILES.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => setSelectedCulture(prof)}
                    className={`flex-1 p-3.5 rounded-xl border text-left transition ${
                      selectedCulture.id === prof.id
                        ? 'bg-cyan-950/50 border-cyan-500/60 shadow-lg'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-sm block text-white">{prof.name}</span>
                    <span className="text-xs text-slate-400">{prof.species} • {prof.morphology}</span>
                  </button>
                ))}
              </div>

              {/* Selected Profile Breakdown */}
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900">
                    <span className="text-slate-500 block">Days In Vitro</span>
                    <span className="text-base font-bold text-cyan-400 font-mono">DIV {selectedCulture.daysInVitroDIV}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900">
                    <span className="text-slate-500 block">Cell Density</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">{selectedCulture.cellDensityPerMm2} cells/mm²</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900">
                    <span className="text-slate-500 block">Culture Viability</span>
                    <span className="text-base font-bold text-cyan-300 font-mono">{selectedCulture.viabilityPercentage}%</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900">
                    <span className="text-slate-500 block">Synaptogenesis Score</span>
                    <span className="text-base font-bold text-purple-400 font-mono">{(selectedCulture.synaptogenesisScore * 100).toFixed(0)}% Mature</span>
                  </div>
                </div>

                {/* Subpopulation Breakdown Table */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Cellular Subpopulations & Electrophysiological Phenotypes
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#070b14]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase border-b border-slate-800 font-mono">
                        <tr>
                          <th className="p-3">Cell Subpopulation</th>
                          <th className="p-3">Proportion</th>
                          <th className="p-3">Genetic Marker</th>
                          <th className="p-3">Resting Vm</th>
                          <th className="p-3">AP Threshold</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {selectedCulture.subpopulations.map((sub, i) => (
                          <tr key={i} className="hover:bg-slate-900/40">
                            <td className="p-3 text-slate-200 font-sans font-medium">{sub.cellType}</td>
                            <td className="p-3 text-cyan-400">{sub.percentage}%</td>
                            <td className="p-3 text-slate-400">{sub.markerGene}</td>
                            <td className="p-3 text-emerald-400">{sub.restingMembranePotentialMv} mV</td>
                            <td className="p-3 text-amber-400">{sub.actionPotentialThresholdMv ? `${sub.actionPotentialThresholdMv} mV` : 'N/A (Glial)'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Perfusion & Chemical Environment */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 text-xs space-y-1.5">
                  <span className="font-bold text-slate-300 block">Media & Incubation Formulation:</span>
                  <p className="text-slate-400 font-mono">{selectedCulture.perfusionMedium}</p>
                  <div className="flex gap-4 text-slate-500 font-mono text-[11px] pt-1">
                    <span>pH: {selectedCulture.ph}</span>
                    <span>Osmolarity: {selectedCulture.osmolarityMosm} mOsm</span>
                    <span>Temperature: {selectedCulture.temperatureC}°C</span>
                    <span>Dissolved O₂: {selectedCulture.dissolvedO2Kpa} kPa</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-base text-white">Cortical Labs CL1 Transducer & ASIC Architecture</h3>
                <p className="text-slate-300 leading-relaxed">
                  The CL1 system translates biological extracellular voltage potentials into digital frames using custom analog front-end (AFE) circuits integrated directly beneath the culture well.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-900 space-y-1.5">
                    <span className="font-mono text-cyan-300 font-bold block">1. 64-Ch Microelectrode ASIC</span>
                    <p className="text-[11px] text-slate-400">
                      8×8 square grid, 30 μm TiN electrode diameter, 200 μm pitch. Corner electrodes (0, 7, 56, 63) tied directly to analog ground.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-900 space-y-1.5">
                    <span className="font-mono text-cyan-300 font-bold block">2. FPGA Real-Time Producer</span>
                    <p className="text-[11px] text-slate-400">
                      Dedicated hardware FPGA reads 25 kHz per channel, running hardware thresholding and streaming to Linux kernel shared memory segments.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-900 space-y-1.5">
                    <span className="font-mono text-cyan-300 font-bold block">3. Digital Charge Interlock</span>
                    <p className="text-[11px] text-slate-400">
                      Hardware trip circuit disconnects stim lines if cumulative charge surpasses 3000 pC or current exceeds 3.0 μA, guaranteeing tissue longevity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
