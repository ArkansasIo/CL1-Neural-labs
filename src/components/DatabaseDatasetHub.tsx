import React, { useState } from 'react';
import {
  Database,
  Table,
  FileSpreadsheet,
  Download,
  Play,
  Search,
  Code,
  FileCode,
  Check,
  Copy,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { globalDatabaseStore } from '../simulation/databaseStore';

export const DatabaseDatasetHub: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('recording_sessions');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM recording_sessions WHERE total_spikes > 10000;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [copiedQuery, setCopiedQuery] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const tables = globalDatabaseStore.getTableNames();
  const currentData = globalDatabaseStore.getTableData(selectedTable);

  const filteredData = currentData.filter((row) => {
    if (!searchFilter.trim()) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  const columns = currentData.length > 0 ? Object.keys(currentData[0]) : [];

  const handleRunQuery = () => {
    const result = globalDatabaseStore.executeQuery(sqlQuery);
    setQueryResult(result);
  };

  const handleExportTableExcel = () => {
    globalDatabaseStore.exportTableToExcel(selectedTable);
    setExportNotice(`Exported ${selectedTable} to Excel (.xlsx)!`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportFullExcel = () => {
    globalDatabaseStore.exportFullWorkbookToExcel();
    setExportNotice('Exported Complete CL1 Multi-Sheet Workbook (.xlsx)!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportCsv = () => {
    globalDatabaseStore.exportTableToCsv(selectedTable);
    setExportNotice(`Exported ${selectedTable} to CSV (.csv)!`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleDownloadSchemaSql = () => {
    const link = document.createElement('a');
    link.href = '/database/schema.sql';
    link.download = 'schema.sql';
    link.click();
  };

  const handleDownloadSeedSql = () => {
    const link = document.createElement('a');
    link.href = '/database/seed_dataset.sql';
    link.download = 'seed_dataset.sql';
    link.click();
  };

  const sqlTemplates = [
    { label: 'All Recording Sessions', query: 'SELECT * FROM recording_sessions;' },
    { label: 'Active MEA Electrodes', query: "SELECT * FROM electrodes WHERE status = 'Active';" },
    { label: 'High Score Experiments', query: 'SELECT * FROM closed_loop_experiments WHERE score >= 20;' },
    { label: 'Biphasic Stim Log', query: "SELECT * FROM stimulation_events WHERE pulse_type = 'Biphasic';" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#080c14] text-slate-100 p-4 select-none">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold tracking-wide">CL1 MySQL Database & Excel Dataset Hub</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                Relational Data Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Query relational electrophysiology tables, inspect 64-channel recordings, and export real Excel workbooks and CSV datasets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportTableExcel}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-[0.98]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Table (.xlsx)</span>
            </button>

            <button
              onClick={handleExportFullExcel}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition active:scale-[0.98]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Full Workbook (.xlsx)</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        {exportNotice && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Table Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {tables.map((t) => (
            <button
              key={t}
              onClick={() => {
                setSelectedTable(t);
                setSearchFilter('');
                setQueryResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-mono transition whitespace-nowrap flex items-center gap-1.5 ${
                selectedTable === t && !queryResult
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-[#0b101c] text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{t}</span>
            </button>
          ))}
        </div>

        {/* Interactive SQL Query Console */}
        <div className="bg-[#0b101c] p-4 rounded-xl border border-slate-800/80 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-300 uppercase tracking-wider">
              <Code className="w-4 h-4 text-cyan-400" />
              <span>Interactive SQL Query Console</span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-500">Templates:</span>
              {sqlTemplates.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSqlQuery(item.query)}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="flex-1 p-2.5 bg-slate-950 text-cyan-300 font-mono text-xs rounded-lg border border-slate-900 focus:outline-none focus:border-cyan-500/50 resize-none h-16 leading-relaxed"
            />
            <button
              onClick={handleRunQuery}
              className="px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/25 transition active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Strip */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Filter records in ${selectedTable}...`}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0b101c] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <span className="font-mono text-slate-400 text-[11px]">
            Showing {filteredData.length} records in <strong className="text-cyan-400">{selectedTable}</strong>
          </span>
        </div>

        {/* Data Table Grid */}
        <div className="bg-[#0b101c] rounded-xl border border-slate-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase border-b border-slate-800 font-mono sticky top-0 z-10 backdrop-blur">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="p-3 font-semibold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {filteredData.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-900/40 transition">
                    {columns.map((col) => (
                      <td key={col} className="p-3 whitespace-nowrap">
                        {typeof row[col] === 'boolean' ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              row[col] ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {row[col] ? 'TRUE' : 'FALSE'}
                          </span>
                        ) : typeof row[col] === 'number' ? (
                          <span className="text-cyan-300">{row[col]}</span>
                        ) : (
                          <span>{String(row[col])}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="p-6 text-center text-slate-500 italic">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Schema & Seed Files Download Bar */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-300 block">Raw MySQL Database Artifacts</span>
            <span className="text-[11px] text-slate-400">
              Ready-to-execute `.sql` scripts located in `/database/` for production MySQL/MariaDB deployments.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSchemaSql}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 flex items-center gap-1.5 transition"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Download schema.sql</span>
            </button>

            <button
              onClick={handleDownloadSeedSql}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 flex items-center gap-1.5 transition"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Download seed_dataset.sql</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
