USE cl1_neural_lab;
CREATE TABLE IF NOT EXISTS education_nodes (
  node_id VARCHAR(128) PRIMARY KEY,
  curriculum_level ENUM('kindergarten','elementary','middle_school','high_school','college','university') NOT NULL,
  attempts BIGINT UNSIGNED NOT NULL DEFAULT 0,
  correct BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS education_lessons (
  lesson_id VARCHAR(128) PRIMARY KEY, domain VARCHAR(64) NOT NULL, curriculum_level VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL, concepts_json JSON NOT NULL, examples_json JSON NOT NULL, difficulty INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS education_attempts (
  attempt_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, node_id VARCHAR(128) NOT NULL, lesson_id VARCHAR(128) NOT NULL,
  question TEXT NOT NULL, expected_answer TEXT NULL, produced_answer TEXT NULL, score DOUBLE NOT NULL,
  solver_version VARCHAR(64) NOT NULL, source_kind VARCHAR(64) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(node_id) REFERENCES education_nodes(node_id), FOREIGN KEY(lesson_id) REFERENCES education_lessons(lesson_id),
  INDEX idx_education_node_time(node_id,created_at)
);
