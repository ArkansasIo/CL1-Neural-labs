-- Additive provenance-aware schema for biological and non-biological recordings.
USE cl1_neural_lab;

CREATE TABLE IF NOT EXISTS measurement_sources (
  source_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  source_kind ENUM('physical_cl1','sdk_simulator','dataset_replay','synthetic_model','unverified_recording_file') NOT NULL,
  source_system_id VARCHAR(128) NULL,
  project_id VARCHAR(128) NULL,
  chip_id VARCHAR(128) NULL,
  cell_batch_id VARCHAR(128) NULL,
  recording_path TEXT NULL,
  recording_sha256 CHAR(64) NULL,
  sampling_frequency_hz DOUBLE NULL,
  channel_count INT UNSIGNED NULL,
  provenance_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_measurement_source_kind(source_kind),
  INDEX idx_measurement_source_system(source_system_id)
);

CREATE TABLE IF NOT EXISTS biological_measurements (
  measurement_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  source_id BIGINT UNSIGNED NOT NULL,
  timestamp_frame BIGINT UNSIGNED NOT NULL,
  channel_index INT UNSIGNED NOT NULL,
  measurement_type ENUM('raw_sample','spike','stimulation_event','derived_metric') NOT NULL,
  value_double DOUBLE NULL,
  unit VARCHAR(32) NULL,
  payload_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_measurement_source FOREIGN KEY(source_id) REFERENCES measurement_sources(source_id),
  INDEX idx_measurement_time(source_id,timestamp_frame),
  INDEX idx_measurement_channel(source_id,channel_index,measurement_type)
);
