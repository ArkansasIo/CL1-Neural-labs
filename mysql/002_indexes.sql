USE cl1_neural_labs;

CREATE INDEX idx_runs_created_at ON experiment_runs (created_at);
CREATE INDEX idx_heartbeat_service_time ON service_heartbeats (service_name, heartbeat_at);
CREATE INDEX idx_events_type_time ON neural_events (event_type, created_at);
