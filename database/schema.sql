-- ====================================================================
-- Cortical Labs CL1 Biological Neural Network System - MySQL Schema
-- Version: 1.0.0
-- Compatible with: MySQL 8.0+ / MariaDB 10.5+
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- 1. Table: cultures
-- Biological wetware monolayer and organoid culture metadata
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `cultures`;
CREATE TABLE `cultures` (
    `culture_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `species` VARCHAR(64) NOT NULL, -- e.g., 'Homo sapiens (Human iPSC)', 'Mus musculus'
    `morphology` ENUM('Monolayer 2D', 'Brain Organoid 3D', 'Assembloid Cortico-Striatal') NOT NULL DEFAULT 'Monolayer 2D',
    `differentiation_protocol` VARCHAR(128) NOT NULL, -- e.g., 'Ngn2 Rapid Induction'
    `days_in_vitro_div` INT UNSIGNED NOT NULL DEFAULT 28,
    `cell_density_per_mm2` INT UNSIGNED NOT NULL DEFAULT 2500,
    `viability_percentage` DECIMAL(5,2) NOT NULL DEFAULT 94.50,
    `glial_ratio` DECIMAL(4,3) NOT NULL DEFAULT 0.250,
    `synaptogenesis_score` DECIMAL(4,3) NOT NULL DEFAULT 0.850,
    `perfusion_medium` VARCHAR(255) NOT NULL DEFAULT 'BrainPhys + SM1 + N2 + BDNF',
    `ph_level` DECIMAL(3,2) NOT NULL DEFAULT 7.35,
    `osmolarity_mosm` INT UNSIGNED NOT NULL DEFAULT 305,
    `temperature_c` DECIMAL(4,2) NOT NULL DEFAULT 37.00,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`culture_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Table: culture_subpopulations
-- Cellular sub-populations, ratios, and electrophysiological properties
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `culture_subpopulations`;
CREATE TABLE `culture_subpopulations` (
    `subpop_id` INT AUTO_INCREMENT NOT NULL,
    `culture_id` VARCHAR(64) NOT NULL,
    `cell_type` VARCHAR(128) NOT NULL, -- e.g., 'Glutamatergic Pyramidal'
    `percentage` DECIMAL(5,2) NOT NULL,
    `marker_gene` VARCHAR(64) NOT NULL, -- e.g., 'VGLUT1 / TBR1'
    `resting_vm_mv` DECIMAL(5,2) NOT NULL, -- e.g., -68.4 mV
    `input_resistance_mohm` DECIMAL(6,2) NOT NULL,
    `action_potential_threshold_mv` DECIMAL(5,2) DEFAULT NULL,
    PRIMARY KEY (`subpop_id`),
    CONSTRAINT `fk_subpop_culture` FOREIGN KEY (`culture_id`) REFERENCES `cultures` (`culture_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. Table: electrodes
-- 64 Microelectrode Array transducer pinouts and spatial geometry
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `electrodes`;
CREATE TABLE `electrodes` (
    `channel_id` TINYINT UNSIGNED NOT NULL, -- 0 to 63
    `row_idx` TINYINT UNSIGNED NOT NULL,   -- 0 to 7
    `col_idx` TINYINT UNSIGNED NOT NULL,   -- 0 to 7
    `x_microns` INT NOT NULL,             -- spatial coordinate
    `y_microns` INT NOT NULL,
    `electrode_material` VARCHAR(64) NOT NULL DEFAULT 'Titanium Nitride (TiN)',
    `impedance_1khz_kohm` DECIMAL(7,2) NOT NULL DEFAULT 380.00,
    `charge_injection_limit_pc` INT UNSIGNED NOT NULL DEFAULT 3000,
    `is_grounded` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_reference` BOOLEAN NOT NULL DEFAULT FALSE,
    `status` ENUM('Active', 'Grounded', 'Reference', 'High-Impedance') NOT NULL DEFAULT 'Active',
    PRIMARY KEY (`channel_id`),
    UNIQUE KEY `uk_grid_pos` (`row_idx`, `col_idx`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. Table: recording_sessions
-- Electrophysiological HDF5 recording acquisitions
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `recording_sessions`;
CREATE TABLE `recording_sessions` (
    `session_id` VARCHAR(64) NOT NULL,
    `culture_id` VARCHAR(64) NOT NULL,
    `start_timestamp` BIGINT UNSIGNED NOT NULL,
    `duration_seconds` DECIMAL(8,2) NOT NULL,
    `sampling_frequency_hz` INT UNSIGNED NOT NULL DEFAULT 25000,
    `frame_count` BIGINT UNSIGNED NOT NULL,
    `total_spikes` INT UNSIGNED NOT NULL DEFAULT 0,
    `total_stims` INT UNSIGNED NOT NULL DEFAULT 0,
    `avg_firing_rate_hz` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    `branching_ratio_sigma` DECIMAL(5,3) NOT NULL DEFAULT 1.000,
    `file_path` VARCHAR(255) NOT NULL, -- e.g., '/data/recordings/CL1_REC_20261013.h5'
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`session_id`),
    CONSTRAINT `fk_session_culture` FOREIGN KEY (`culture_id`) REFERENCES `cultures` (`culture_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. Table: spike_events
-- Sorted extracellular action potentials with 75-sample waveforms
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `spike_events`;
CREATE TABLE `spike_events` (
    `spike_id` BIGINT AUTO_INCREMENT NOT NULL,
    `session_id` VARCHAR(64) NOT NULL,
    `channel_id` TINYINT UNSIGNED NOT NULL,
    `timestamp_us` BIGINT UNSIGNED NOT NULL,
    `peak_amplitude_uv` DECIMAL(7,2) NOT NULL, -- e.g., -78.4 uV
    `overshoot_amplitude_uv` DECIMAL(7,2) NOT NULL DEFAULT 28.5,
    `snr_db` DECIMAL(5,2) NOT NULL DEFAULT 18.4,
    `samples_json` JSON DEFAULT NULL, -- 75 floating-point samples
    PRIMARY KEY (`spike_id`),
    KEY `idx_session_channel` (`session_id`, `channel_id`),
    KEY `idx_timestamp` (`timestamp_us`),
    CONSTRAINT `fk_spike_session` FOREIGN KEY (`session_id`) REFERENCES `recording_sessions` (`session_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_spike_channel` FOREIGN KEY (`channel_id`) REFERENCES `electrodes` (`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. Table: stimulation_events
-- Electrical stim pulses delivered to wetware
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `stimulation_events`;
CREATE TABLE `stimulation_events` (
    `stim_id` BIGINT AUTO_INCREMENT NOT NULL,
    `session_id` VARCHAR(64) NOT NULL,
    `channel_id` TINYINT UNSIGNED NOT NULL,
    `timestamp_us` BIGINT UNSIGNED NOT NULL,
    `pulse_type` ENUM('Monophasic', 'Biphasic', 'Triphasic') NOT NULL DEFAULT 'Biphasic',
    `phase1_duration_us` INT UNSIGNED NOT NULL DEFAULT 160,
    `phase1_current_ua` DECIMAL(4,2) NOT NULL DEFAULT -1.00,
    `phase2_duration_us` INT UNSIGNED DEFAULT 160,
    `phase2_current_ua` DECIMAL(4,2) DEFAULT 1.00,
    `total_duration_us` INT UNSIGNED NOT NULL DEFAULT 320,
    `total_charge_pc` DECIMAL(8,2) NOT NULL DEFAULT 320.00,
    PRIMARY KEY (`stim_id`),
    KEY `idx_stim_session` (`session_id`),
    KEY `idx_stim_channel` (`channel_id`),
    CONSTRAINT `fk_stim_session` FOREIGN KEY (`session_id`) REFERENCES `recording_sessions` (`session_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_stim_channel` FOREIGN KEY (`channel_id`) REFERENCES `electrodes` (`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 7. Table: closed_loop_experiments
-- DishBrain Pong, Conditioning, and Maze experiment runs
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `closed_loop_experiments`;
CREATE TABLE `closed_loop_experiments` (
    `experiment_id` VARCHAR(64) NOT NULL,
    `session_id` VARCHAR(64) NOT NULL,
    `experiment_type` ENUM('DishBrain Pong', 'Associative Conditioning', 'Spatial Maze Navigation') NOT NULL,
    `total_trials` INT UNSIGNED NOT NULL DEFAULT 0,
    `score` INT NOT NULL DEFAULT 0,
    `longest_rally` INT NOT NULL DEFAULT 0,
    `hits_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `misses_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `hit_rate_pct` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `synaptic_potentiation_ltp_pct` DECIMAL(5,2) DEFAULT 0.00,
    `free_energy_reduction_score` DECIMAL(6,3) DEFAULT NULL,
    `telemetry_json` JSON DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`experiment_id`),
    CONSTRAINT `fk_exp_session` FOREIGN KEY (`session_id`) REFERENCES `recording_sessions` (`session_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 8. Table: dsp_filter_configs
-- Signal conditioning and spike detection parameter profiles
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `dsp_filter_configs`;
CREATE TABLE `dsp_filter_configs` (
    `config_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `highpass_cutoff_hz` INT UNSIGNED NOT NULL DEFAULT 300,
    `lowpass_cutoff_hz` INT UNSIGNED NOT NULL DEFAULT 3000,
    `notch_50hz` BOOLEAN NOT NULL DEFAULT TRUE,
    `notch_60hz` BOOLEAN NOT NULL DEFAULT FALSE,
    `crosstalk_blanking_us` INT UNSIGNED NOT NULL DEFAULT 2000,
    `threshold_sigma_multiplier` DECIMAL(3,1) NOT NULL DEFAULT -5.0,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (`config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
