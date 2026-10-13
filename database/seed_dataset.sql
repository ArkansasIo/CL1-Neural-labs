-- ====================================================================
-- Cortical Labs CL1 Seed Dataset - Realistic Electrophysiology Data
-- ====================================================================

-- 1. Insert 64 Microelectrodes (8x8 Grid, pitch 200 um)
INSERT INTO `electrodes` (`channel_id`, `row_idx`, `col_idx`, `x_microns`, `y_microns`, `electrode_material`, `impedance_1khz_kohm`, `is_grounded`, `is_reference`, `status`) VALUES
-- Col 0
(0, 0, 0, -700, -700, 'Titanium Nitride (TiN)', 25.0, TRUE, FALSE, 'Grounded'),
(1, 1, 0, -700, -500, 'Titanium Nitride (TiN)', 385.0, FALSE, FALSE, 'Active'),
(2, 2, 0, -700, -300, 'Titanium Nitride (TiN)', 372.0, FALSE, FALSE, 'Active'),
(3, 3, 0, -700, -100, 'Titanium Nitride (TiN)', 390.0, FALSE, FALSE, 'Active'),
(4, 4, 0, -700,  100, 'Titanium Nitride (TiN)', 120.0, FALSE, TRUE, 'Reference'),
(5, 5, 0, -700,  300, 'Titanium Nitride (TiN)', 365.0, FALSE, FALSE, 'Active'),
(6, 6, 0, -700,  500, 'Titanium Nitride (TiN)', 395.0, FALSE, FALSE, 'Active'),
(7, 7, 0, -700,  700, 'Titanium Nitride (TiN)', 25.0, TRUE, FALSE, 'Grounded'),
-- Col 1
(8,  0, 1, -500, -700, 'Titanium Nitride (TiN)', 378.0, FALSE, FALSE, 'Active'),
(9,  1, 1, -500, -500, 'Titanium Nitride (TiN)', 382.0, FALSE, FALSE, 'Active'),
(10, 2, 1, -500, -300, 'Titanium Nitride (TiN)', 360.0, FALSE, FALSE, 'Active'),
(11, 3, 1, -500, -100, 'Titanium Nitride (TiN)', 374.0, FALSE, FALSE, 'Active'),
(12, 4, 1, -500,  100, 'Titanium Nitride (TiN)', 388.0, FALSE, FALSE, 'Active'),
(13, 5, 1, -500,  300, 'Titanium Nitride (TiN)', 392.0, FALSE, FALSE, 'Active'),
(14, 6, 1, -500,  500, 'Titanium Nitride (TiN)', 380.0, FALSE, FALSE, 'Active'),
(15, 7, 1, -500,  700, 'Titanium Nitride (TiN)', 370.0, FALSE, FALSE, 'Active'),
-- Col 2
(16, 0, 2, -300, -700, 'Titanium Nitride (TiN)', 365.0, FALSE, FALSE, 'Active'),
(17, 1, 2, -300, -500, 'Titanium Nitride (TiN)', 370.0, FALSE, FALSE, 'Active'),
(18, 2, 2, -300, -300, 'Titanium Nitride (TiN)', 355.0, FALSE, FALSE, 'Active'),
(19, 3, 2, -300, -100, 'Titanium Nitride (TiN)', 380.0, FALSE, FALSE, 'Active'),
(20, 4, 2, -300,  100, 'Titanium Nitride (TiN)', 375.0, FALSE, FALSE, 'Active'),
(21, 5, 2, -300,  300, 'Titanium Nitride (TiN)', 390.0, FALSE, FALSE, 'Active'),
(22, 6, 2, -300,  500, 'Titanium Nitride (TiN)', 382.0, FALSE, FALSE, 'Active'),
(23, 7, 2, -300,  700, 'Titanium Nitride (TiN)', 368.0, FALSE, FALSE, 'Active'),
-- Col 3
(24, 0, 3, -100, -700, 'Titanium Nitride (TiN)', 362.0, FALSE, FALSE, 'Active'),
(25, 1, 3, -100, -500, 'Titanium Nitride (TiN)', 385.0, FALSE, FALSE, 'Active'),
(26, 2, 3, -100, -300, 'Titanium Nitride (TiN)', 372.0, FALSE, FALSE, 'Active'),
(27, 3, 3, -100, -100, 'Titanium Nitride (TiN)', 395.0, FALSE, FALSE, 'Active'),
(28, 4, 3, -100,  100, 'Titanium Nitride (TiN)', 368.0, FALSE, FALSE, 'Active'),
(29, 5, 3, -100,  300, 'Titanium Nitride (TiN)', 374.0, FALSE, FALSE, 'Active'),
(30, 6, 3, -100,  500, 'Titanium Nitride (TiN)', 388.0, FALSE, FALSE, 'Active'),
(31, 7, 3, -100,  700, 'Titanium Nitride (TiN)', 380.0, FALSE, FALSE, 'Active'),
-- Col 4
(32, 0, 4,  100, -700, 'Titanium Nitride (TiN)', 370.0, FALSE, FALSE, 'Active'),
(33, 1, 4,  100, -500, 'Titanium Nitride (TiN)', 382.0, FALSE, FALSE, 'Active'),
(34, 2, 4,  100, -300, 'Titanium Nitride (TiN)', 365.0, FALSE, FALSE, 'Active'),
(35, 3, 4,  100, -100, 'Titanium Nitride (TiN)', 390.0, FALSE, FALSE, 'Active'),
(36, 4, 4,  100,  100, 'Titanium Nitride (TiN)', 378.0, FALSE, FALSE, 'Active'),
(37, 5, 4,  100,  300, 'Titanium Nitride (TiN)', 364.0, FALSE, FALSE, 'Active'),
(38, 6, 4,  100,  500, 'Titanium Nitride (TiN)', 386.0, FALSE, FALSE, 'Active'),
(39, 7, 4,  100,  700, 'Titanium Nitride (TiN)', 372.0, FALSE, FALSE, 'Active'),
-- Col 5
(40, 0, 5,  300, -700, 'Titanium Nitride (TiN)', 368.0, FALSE, FALSE, 'Active'),
(41, 1, 5,  300, -500, 'Titanium Nitride (TiN)', 380.0, FALSE, FALSE, 'Active'),
(42, 2, 5,  300, -300, 'Titanium Nitride (TiN)', 358.0, FALSE, FALSE, 'Active'),
(43, 3, 5,  300, -100, 'Titanium Nitride (TiN)', 392.0, FALSE, FALSE, 'Active'),
(44, 4, 5,  300,  100, 'Titanium Nitride (TiN)', 376.0, FALSE, FALSE, 'Active'),
(45, 5, 5,  300,  300, 'Titanium Nitride (TiN)', 384.0, FALSE, FALSE, 'Active'),
(46, 6, 5,  300,  500, 'Titanium Nitride (TiN)', 390.0, FALSE, FALSE, 'Active'),
(47, 7, 5,  300,  700, 'Titanium Nitride (TiN)', 365.0, FALSE, FALSE, 'Active'),
-- Col 6
(48, 0, 6,  500, -700, 'Titanium Nitride (TiN)', 375.0, FALSE, FALSE, 'Active'),
(49, 1, 6,  500, -500, 'Titanium Nitride (TiN)', 388.0, FALSE, FALSE, 'Active'),
(50, 2, 6,  500, -300, 'Titanium Nitride (TiN)', 364.0, FALSE, FALSE, 'Active'),
(51, 3, 6,  500, -100, 'Titanium Nitride (TiN)', 395.0, FALSE, FALSE, 'Active'),
(52, 4, 6,  500,  100, 'Titanium Nitride (TiN)', 380.0, FALSE, FALSE, 'Active'),
(53, 5, 6,  500,  300, 'Titanium Nitride (TiN)', 372.0, FALSE, FALSE, 'Active'),
(54, 6, 6,  500,  500, 'Titanium Nitride (TiN)', 385.0, FALSE, FALSE, 'Active'),
(55, 7, 6,  500,  700, 'Titanium Nitride (TiN)', 368.0, FALSE, FALSE, 'Active'),
-- Col 7
(56, 0, 7,  700, -700, 'Titanium Nitride (TiN)', 25.0, TRUE, FALSE, 'Grounded'),
(57, 1, 7,  700, -500, 'Titanium Nitride (TiN)', 380.0, FALSE, FALSE, 'Active'),
(58, 2, 7,  700, -300, 'Titanium Nitride (TiN)', 365.0, FALSE, FALSE, 'Active'),
(59, 3, 7,  700, -100, 'Titanium Nitride (TiN)', 388.0, FALSE, FALSE, 'Active'),
(60, 4, 7,  700,  100, 'Titanium Nitride (TiN)', 375.0, FALSE, FALSE, 'Active'),
(61, 5, 7,  700,  300, 'Titanium Nitride (TiN)', 392.0, FALSE, FALSE, 'Active'),
(62, 6, 7,  700,  500, 'Titanium Nitride (TiN)', 384.0, FALSE, FALSE, 'Active'),
(63, 7, 7,  700,  700, 'Titanium Nitride (TiN)', 25.0, TRUE, FALSE, 'Grounded');

-- 2. Insert Cultures
INSERT INTO `cultures` (`culture_id`, `name`, `species`, `morphology`, `differentiation_protocol`, `days_in_vitro_div`, `cell_density_per_mm2`, `viability_percentage`, `glial_ratio`, `synaptogenesis_score`, `perfusion_medium`, `ph_level`, `osmolarity_mosm`, `temperature_c`) VALUES
('CULT-HUMAN-IPSC-001', 'Human iPSC Cortical Culture Alpha', 'Homo sapiens (Human iPSC)', 'Monolayer 2D', 'Ngn2 Rapid Induction', 35, 2400, 94.50, 0.220, 0.880, 'BrainPhys + SM1 + N2 + BDNF (20 ng/mL)', 7.35, 305, 37.00),
('CULT-MOUSE-E18-002', 'Primary Mouse Embryonic Cortical Beta', 'Mus musculus', 'Monolayer 2D', 'Primary Dissociated E18', 21, 3100, 91.80, 0.350, 0.920, 'Neurobasal Plus + B-27 Plus + GlutaMAX', 7.38, 298, 37.00),
('CULT-ORGANOID-003', 'Human Forebrain 3D Organoid Gamma', 'Homo sapiens (Human iPSC)', 'Brain Organoid 3D', 'Dual-SMAD Directed', 60, 4200, 89.20, 0.400, 0.950, 'BrainPhys Organoid Maturation Formula', 7.32, 310, 37.00);

-- 3. Insert Culture Subpopulations
INSERT INTO `culture_subpopulations` (`culture_id`, `cell_type`, `percentage`, `marker_gene`, `resting_vm_mv`, `input_resistance_mohm`, `action_potential_threshold_mv`) VALUES
('CULT-HUMAN-IPSC-001', 'Glutamatergic Pyramidal (Layer 2/3 & 5)', 75.00, 'VGLUT1 / TBR1', -68.40, 380.00, -38.20),
('CULT-HUMAN-IPSC-001', 'GABAergic Interneurons (PV/SST)', 18.00, 'GAD67 / PV', -62.10, 450.00, -41.00),
('CULT-HUMAN-IPSC-001', 'Cortical Astrocytes', 7.00, 'GFAP / S100B', -82.00, 45.00, NULL),
('CULT-MOUSE-E18-002', 'Cortical Projection Neurons', 70.00, 'NeuN / MAP2', -65.20, 320.00, -36.50),
('CULT-MOUSE-E18-002', 'Cortical Interneurons', 20.00, 'VGAT', -60.80, 390.00, -40.20),
('CULT-MOUSE-E18-002', 'Primary Astrocytes', 10.00, 'ALDH1L1', -80.50, 50.00, NULL);

-- 4. Insert Recording Sessions
INSERT INTO `recording_sessions` (`session_id`, `culture_id`, `start_timestamp`, `duration_seconds`, `sampling_frequency_hz`, `frame_count`, `total_spikes`, `total_stims`, `avg_firing_rate_hz`, `branching_ratio_sigma`, `file_path`, `notes`) VALUES
('SES-20261013-001', 'CULT-HUMAN-IPSC-001', 1791980000000, 300.00, 25000, 7500000, 68420, 1420, 4.82, 1.002, '/data/recordings/CL1_SES_20261013_001.h5', 'Baseline spontaneous activity and closed-loop Pong evaluation.'),
('SES-20261013-002', 'CULT-HUMAN-IPSC-001', 1791983600000, 180.00, 25000, 4500000, 45180, 890, 5.14, 0.998, '/data/recordings/CL1_SES_20261013_002.h5', 'STDP Associative Conditioning trial series (CS Ch12, US Ch28).'),
('SES-20261013-003', 'CULT-MOUSE-E18-002', 1791987200000, 240.00, 25000, 6000000, 61300, 1200, 5.92, 1.014, '/data/recordings/CL1_SES_20261013_003.h5', 'Mouse cortical baseline recording and burst avalanche analysis.');

-- 5. Insert Closed-Loop Experiments
INSERT INTO `closed_loop_experiments` (`experiment_id`, `session_id`, `experiment_type`, `total_trials`, `score`, `longest_rally`, `hits_count`, `misses_count`, `hit_rate_pct`, `synaptic_potentiation_ltp_pct`, `free_energy_reduction_score`) VALUES
('EXP-PONG-001', 'SES-20261013-001', 'DishBrain Pong', 85, 24, 18, 142, 38, 78.89, 24.50, 0.884),
('EXP-STDP-002', 'SES-20261013-002', 'Associative Conditioning', 40, 32, 0, 32, 8, 80.00, 42.80, 0.912);

-- 6. Insert Sample Spike Events
INSERT INTO `spike_events` (`session_id`, `channel_id`, `timestamp_us`, `peak_amplitude_uv`, `overshoot_amplitude_uv`, `snr_db`) VALUES
('SES-20261013-001', 10, 145020, -78.40, 26.50, 19.20),
('SES-20261013-001', 18, 145180, -82.10, 31.00, 21.00),
('SES-20261013-001', 34, 148200, -71.50, 22.80, 17.50),
('SES-20261013-001', 42, 152400, -85.20, 34.00, 22.40),
('SES-20261013-001', 12, 156800, -74.80, 25.10, 18.60);

-- 7. Insert Sample Stimulation Events
INSERT INTO `stimulation_events` (`session_id`, `channel_id`, `timestamp_us`, `pulse_type`, `phase1_duration_us`, `phase1_current_ua`, `phase2_duration_us`, `phase2_current_ua`, `total_duration_us`, `total_charge_pc`) VALUES
('SES-20261013-001', 10, 140000, 'Biphasic', 160, -1.00, 160, 1.00, 320, 320.00),
('SES-20261013-001', 18, 280000, 'Biphasic', 160, -1.00, 160, 1.00, 320, 320.00),
('SES-20261013-001', 34, 420000, 'Biphasic', 160, -1.50, 160, 1.50, 320, 480.00);

-- 8. Insert DSP Filter Configurations
INSERT INTO `dsp_filter_configs` (`config_id`, `name`, `highpass_cutoff_hz`, `lowpass_cutoff_hz`, `notch_50hz`, `notch_60hz`, `crosstalk_blanking_us`, `threshold_sigma_multiplier`, `is_active`) VALUES
('DSP-STANDARD-25KHZ', 'CL1 Standard Extracellular Bandpass', 300, 3000, TRUE, FALSE, 2000, -5.0, TRUE),
('DSP-LFP-BROADBAND', 'Local Field Potential (LFP) Broadband', 1, 300, TRUE, FALSE, 5000, -4.0, FALSE);
