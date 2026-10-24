CREATE DATABASE IF NOT EXISTS cl1_neural_labs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cl1_neural_labs;

CREATE TABLE IF NOT EXISTS service_heartbeats (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  service_name VARCHAR(128) NOT NULL,
  heartbeat_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_service_heartbeat (service_name, heartbeat_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS experiment_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  experiment_name VARCHAR(255) NOT NULL,
  ticks_requested BIGINT UNSIGNED NOT NULL DEFAULT 0,
  observations BIGINT UNSIGNED NOT NULL DEFAULT 0,
  stims_applied BIGINT UNSIGNED NOT NULL DEFAULT 0,
  stims_rejected BIGINT UNSIGNED NOT NULL DEFAULT 0,
  summary_json JSON NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  INDEX idx_experiment_created (experiment_name, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS neural_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  channel_id TINYINT UNSIGNED NOT NULL,
  event_type VARCHAR(32) NOT NULL,
  amplitude_uv DOUBLE NULL,
  event_tick BIGINT UNSIGNED NULL,
  payload_json JSON NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  INDEX idx_neural_event_channel_time (channel_id, created_at),
  CONSTRAINT chk_channel_id CHECK (channel_id < 64)
) ENGINE=InnoDB;
