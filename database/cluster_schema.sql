CREATE DATABASE IF NOT EXISTS cl1_neural_lab;
USE cl1_neural_lab;
CREATE TABLE IF NOT EXISTS virtual_clusters (
 cluster_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cluster_name VARCHAR(128) NOT NULL,
 requested_size INT NOT NULL, source_type VARCHAR(32) NOT NULL DEFAULT 'simulator',
 software_version VARCHAR(64) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CHECK (requested_size IN (1,2,4,8,16,32,64,128))
);
CREATE TABLE IF NOT EXISTS virtual_devices (
 device_pk BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cluster_id BIGINT UNSIGNED NOT NULL,
 device_slot INT NOT NULL, device_id VARCHAR(64) NOT NULL, channel_count INT NOT NULL DEFAULT 64,
 sample_rate_hz INT NOT NULL DEFAULT 25000, mode VARCHAR(32) NOT NULL DEFAULT 'simulator',
 status VARCHAR(32) NOT NULL DEFAULT 'offline', emergency_stop_latched BOOLEAN NOT NULL DEFAULT FALSE,
 last_seen_at TIMESTAMP NULL, FOREIGN KEY(cluster_id) REFERENCES virtual_clusters(cluster_id) ON DELETE CASCADE,
 UNIQUE KEY uq_cluster_slot(cluster_id,device_slot), UNIQUE KEY uq_device_id(device_id)
);
CREATE TABLE IF NOT EXISTS recording_sessions (
 session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, device_pk BIGINT UNSIGNED NOT NULL,
 experiment_id VARCHAR(128), source_type VARCHAR(32) NOT NULL DEFAULT 'simulated',
 started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ended_at TIMESTAMP NULL,
 sample_rate_hz INT NOT NULL, spike_count BIGINT UNSIGNED DEFAULT 0,
 stimulation_count BIGINT UNSIGNED DEFAULT 0, provenance_json JSON,
 FOREIGN KEY(device_pk) REFERENCES virtual_devices(device_pk) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS neural_events (
 event_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, session_id BIGINT UNSIGNED NOT NULL,
 device_channel INT NOT NULL, timestamp_us BIGINT UNSIGNED NOT NULL,
 event_type VARCHAR(32) NOT NULL, amplitude_uv DOUBLE, metadata_json JSON,
 FOREIGN KEY(session_id) REFERENCES recording_sessions(session_id) ON DELETE CASCADE,
 INDEX ix_events_time(session_id,timestamp_us)
);
CREATE TABLE IF NOT EXISTS device_audit_events (
 audit_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, device_pk BIGINT UNSIGNED NOT NULL,
 event_type VARCHAR(64) NOT NULL, source_type VARCHAR(32) DEFAULT 'virtual',
 event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, details_json JSON,
 FOREIGN KEY(device_pk) REFERENCES virtual_devices(device_pk) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS experiment_runs (
 run_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, experiment_code VARCHAR(32) NOT NULL,
 device_pk BIGINT UNSIGNED NULL, cluster_id BIGINT UNSIGNED NULL, status VARCHAR(32) DEFAULT 'planned',
 random_seed BIGINT NULL, parameters_json JSON, metrics_json JSON, graph_manifest_json JSON,
 started_at TIMESTAMP NULL, ended_at TIMESTAMP NULL,
 FOREIGN KEY(device_pk) REFERENCES virtual_devices(device_pk) ON DELETE SET NULL,
 FOREIGN KEY(cluster_id) REFERENCES virtual_clusters(cluster_id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS graph_exports (
 graph_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, run_id BIGINT UNSIGNED NOT NULL,
 graph_type VARCHAR(64) NOT NULL, format VARCHAR(16) NOT NULL, source_type VARCHAR(32) NOT NULL,
 file_path VARCHAR(512) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(run_id) REFERENCES experiment_runs(run_id) ON DELETE CASCADE
);