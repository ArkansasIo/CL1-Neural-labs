use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct BackendConfig {
    #[serde(default = "default_host")]
    pub host: String,
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_database_url")]
    pub database_url: String,
    #[serde(default = "default_mysql_enabled")]
    pub mysql_enabled: bool,
    #[serde(default = "default_tick_ms")]
    pub tick_ms: u64,
}

fn default_host() -> String { "0.0.0.0".into() }
fn default_port() -> u16 { 8100 }
fn default_database_url() -> String { "mysql://cl1:cl1@127.0.0.1:3306/cl1_neural_labs".into() }
fn default_mysql_enabled() -> bool { false }
fn default_tick_ms() -> u64 { 40 }

impl Default for BackendConfig {
    fn default() -> Self {
        Self {
            host: default_host(),
            port: default_port(),
            database_url: default_database_url(),
            mysql_enabled: default_mysql_enabled(),
            tick_ms: default_tick_ms(),
        }
    }
}

impl BackendConfig {
    pub fn from_env() -> Self {
        let mut c = Self::default();
        if let Ok(v) = std::env::var("CL1_RUST_HOST") { c.host = v; }
        if let Ok(v) = std::env::var("CL1_RUST_PORT") { if let Ok(n) = v.parse() { c.port = n; } }
        if let Ok(v) = std::env::var("CL1_DATABASE_URL") { c.database_url = v; }
        if let Ok(v) = std::env::var("CL1_MYSQL_ENABLED") { c.mysql_enabled = matches!(v.to_lowercase().as_str(), "1" | "true" | "yes"); }
        if let Ok(v) = std::env::var("CL1_TICK_MS") { if let Ok(n) = v.parse() { c.tick_ms = n.max(1); } }
        c
    }
}
