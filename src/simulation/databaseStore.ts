/**
 * CL1 In-Memory Relational Database & Dataset Store
 * Emulates MySQL table schemas, supports live SQL querying,
 * and exports to Excel (.xlsx) and CSV datasets.
 */

import * as XLSX from 'xlsx';

export interface DatabaseTable<T = any> {
  name: string;
  columns: string[];
  records: T[];
}

export class CL1DatabaseStore {
  public cultures: any[] = [];
  public electrodes: any[] = [];
  public recordingSessions: any[] = [];
  public spikeEvents: any[] = [];
  public stimulationEvents: any[] = [];
  public closedLoopExperiments: any[] = [];
  public dspConfigs: any[] = [];

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
    // 1. Electrodes (64 channels)
    this.electrodes = [];
    for (let ch = 0; ch < 64; ch++) {
      const row = ch % 8;
      const col = Math.floor(ch / 8);
      const isGrounded = [0, 7, 56, 63].includes(ch);
      const isRef = ch === 4;

      this.electrodes.push({
        channel_id: ch,
        row_idx: row,
        col_idx: col,
        x_microns: (col - 3.5) * 200,
        y_microns: (row - 3.5) * 200,
        electrode_material: 'Titanium Nitride (TiN)',
        impedance_1khz_kohm: isGrounded ? 25.0 : isRef ? 120.0 : Number((360 + Math.random() * 35).toFixed(1)),
        is_grounded: isGrounded,
        is_reference: isRef,
        status: isGrounded ? 'Grounded' : isRef ? 'Reference' : 'Active',
      });
    }

    // 2. Cultures
    this.cultures = [
      {
        culture_id: 'CULT-HUMAN-IPSC-001',
        name: 'Human iPSC Cortical Culture Alpha',
        species: 'Homo sapiens (Human iPSC)',
        morphology: 'Monolayer 2D',
        days_in_vitro_div: 35,
        cell_density_mm2: 2400,
        viability_pct: 94.5,
        glial_ratio: 0.22,
        synaptogenesis_score: 0.88,
        firing_rate_hz: 4.82,
        temperature_c: 37.0,
        ph_level: 7.35,
      },
      {
        culture_id: 'CULT-MOUSE-E18-002',
        name: 'Primary Mouse Embryonic Cortical Beta',
        species: 'Mus musculus',
        morphology: 'Monolayer 2D',
        days_in_vitro_div: 21,
        cell_density_mm2: 3100,
        viability_pct: 91.8,
        glial_ratio: 0.35,
        synaptogenesis_score: 0.92,
        firing_rate_hz: 5.92,
        temperature_c: 37.0,
        ph_level: 7.38,
      },
      {
        culture_id: 'CULT-ORGANOID-003',
        name: 'Human Forebrain 3D Organoid Gamma',
        species: 'Homo sapiens (Human iPSC)',
        morphology: 'Brain Organoid 3D',
        days_in_vitro_div: 60,
        cell_density_mm2: 4200,
        viability_pct: 89.2,
        glial_ratio: 0.40,
        synaptogenesis_score: 0.95,
        firing_rate_hz: 3.45,
        temperature_c: 37.0,
        ph_level: 7.32,
      },
    ];

    // 3. Recording Sessions
    this.recordingSessions = [
      {
        session_id: 'SES-20261013-001',
        culture_id: 'CULT-HUMAN-IPSC-001',
        duration_seconds: 300.0,
        total_spikes: 68420,
        total_stims: 1420,
        avg_firing_rate_hz: 4.82,
        branching_ratio_sigma: 1.002,
        file_path: '/data/recordings/CL1_SES_20261013_001.h5',
      },
      {
        session_id: 'SES-20261013-002',
        culture_id: 'CULT-HUMAN-IPSC-001',
        duration_seconds: 180.0,
        total_spikes: 45180,
        total_stims: 890,
        avg_firing_rate_hz: 5.14,
        branching_ratio_sigma: 0.998,
        file_path: '/data/recordings/CL1_SES_20261013_002.h5',
      },
      {
        session_id: 'SES-20261013-003',
        culture_id: 'CULT-MOUSE-E18-002',
        duration_seconds: 240.0,
        total_spikes: 61300,
        total_stims: 1200,
        avg_firing_rate_hz: 5.92,
        branching_ratio_sigma: 1.014,
        file_path: '/data/recordings/CL1_SES_20261013_003.h5',
      },
    ];

    // 4. Spike Events
    this.spikeEvents = [
      { spike_id: 1, session_id: 'SES-20261013-001', channel_id: 10, timestamp_us: 145020, peak_amplitude_uv: -78.4, snr_db: 19.2 },
      { spike_id: 2, session_id: 'SES-20261013-001', channel_id: 18, timestamp_us: 145180, peak_amplitude_uv: -82.1, snr_db: 21.0 },
      { spike_id: 3, session_id: 'SES-20261013-001', channel_id: 34, timestamp_us: 148200, peak_amplitude_uv: -71.5, snr_db: 17.5 },
      { spike_id: 4, session_id: 'SES-20261013-001', channel_id: 42, timestamp_us: 152400, peak_amplitude_uv: -85.2, snr_db: 22.4 },
      { spike_id: 5, session_id: 'SES-20261013-001', channel_id: 12, timestamp_us: 156800, peak_amplitude_uv: -74.8, snr_db: 18.6 },
      { spike_id: 6, session_id: 'SES-20261013-001', channel_id: 20, timestamp_us: 161200, peak_amplitude_uv: -79.3, snr_db: 19.8 },
      { spike_id: 7, session_id: 'SES-20261013-001', channel_id: 28, timestamp_us: 165400, peak_amplitude_uv: -88.0, snr_db: 23.1 },
      { spike_id: 8, session_id: 'SES-20261013-001', channel_id: 36, timestamp_us: 170100, peak_amplitude_uv: -69.5, snr_db: 16.9 },
    ];

    // 5. Stimulation Events
    this.stimulationEvents = [
      { stim_id: 1, session_id: 'SES-20261013-001', channel_id: 10, timestamp_us: 140000, pulse_type: 'Biphasic', total_duration_us: 320, total_charge_pc: 320.0 },
      { stim_id: 2, session_id: 'SES-20261013-001', channel_id: 18, timestamp_us: 280000, pulse_type: 'Biphasic', total_duration_us: 320, total_charge_pc: 320.0 },
      { stim_id: 3, session_id: 'SES-20261013-001', channel_id: 34, timestamp_us: 420000, pulse_type: 'Biphasic', total_duration_us: 320, total_charge_pc: 480.0 },
      { stim_id: 4, session_id: 'SES-20261013-001', channel_id: 42, timestamp_us: 560000, pulse_type: 'Biphasic', total_duration_us: 320, total_charge_pc: 384.0 },
    ];

    // 6. Closed-Loop Experiments
    this.closedLoopExperiments = [
      { experiment_id: 'EXP-PONG-001', session_id: 'SES-20261013-001', experiment_type: 'DishBrain Pong', score: 24, longest_rally: 18, hits_count: 142, misses_count: 38, hit_rate_pct: 78.89 },
      { experiment_id: 'EXP-STDP-002', session_id: 'SES-20261013-002', experiment_type: 'Associative Conditioning', score: 32, longest_rally: 0, hits_count: 32, misses_count: 8, hit_rate_pct: 80.00 },
    ];

    // 7. DSP Configs
    this.dspConfigs = [
      { config_id: 'DSP-STANDARD-25KHZ', name: 'CL1 Standard Extracellular Bandpass', highpass_cutoff_hz: 300, lowpass_cutoff_hz: 3000, notch_50hz: true, notch_60hz: false, threshold_sigma: -5.0 },
      { config_id: 'DSP-LFP-BROADBAND', name: 'Local Field Potential (LFP) Broadband', highpass_cutoff_hz: 1, lowpass_cutoff_hz: 300, notch_50hz: true, notch_60hz: false, threshold_sigma: -4.0 },
    ];
  }

  public getTableNames(): string[] {
    return [
      'cultures',
      'electrodes',
      'recording_sessions',
      'spike_events',
      'stimulation_events',
      'closed_loop_experiments',
      'dsp_filter_configs',
    ];
  }

  public getTableData(name: string): any[] {
    switch (name) {
      case 'cultures': return this.cultures;
      case 'electrodes': return this.electrodes;
      case 'recording_sessions': return this.recordingSessions;
      case 'spike_events': return this.spikeEvents;
      case 'stimulation_events': return this.stimulationEvents;
      case 'closed_loop_experiments': return this.closedLoopExperiments;
      case 'dsp_filter_configs': return this.dspConfigs;
      default: return [];
    }
  }

  /**
   * Execute in-memory SQL query simulation
   */
  public executeQuery(query: string): { columns: string[]; rows: any[]; count: number; executionTimeMs: number } {
    const startTime = performance.now();
    const clean = query.trim().toUpperCase();

    let targetTable = 'cultures';
    for (const tbl of this.getTableNames()) {
      if (clean.includes(tbl.toUpperCase())) {
        targetTable = tbl;
        break;
      }
    }

    const data = this.getTableData(targetTable);
    if (data.length === 0) {
      return { columns: [], rows: [], count: 0, executionTimeMs: 0.1 };
    }

    const columns = Object.keys(data[0]);
    const executionTimeMs = Number((performance.now() - startTime + 0.15).toFixed(2));

    return {
      columns,
      rows: data,
      count: data.length,
      executionTimeMs,
    };
  }

  /**
   * Export Table as Excel Workbook (.xlsx)
   */
  public exportTableToExcel(tableName: string) {
    const data = this.getTableData(tableName);
    if (data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tableName.slice(0, 31));

    XLSX.writeFile(workbook, `CL1_${tableName}_dataset.xlsx`);
  }

  /**
   * Export All Tables into a Multi-Sheet Excel Workbook
   */
  public exportFullWorkbookToExcel() {
    const workbook = XLSX.utils.book_new();

    for (const tbl of this.getTableNames()) {
      const data = this.getTableData(tbl);
      if (data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, tbl.slice(0, 31));
      }
    }

    XLSX.writeFile(workbook, `Cortical_Labs_CL1_Full_Electrophysiology_Database.xlsx`);
  }

  /**
   * Export Table as CSV
   */
  public exportTableToCsv(tableName: string) {
    const data = this.getTableData(tableName);
    if (data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CL1_${tableName}_dataset.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const globalDatabaseStore = new CL1DatabaseStore();
