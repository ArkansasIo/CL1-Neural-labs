//! Periodic persistence worker for CL1 Neural Labs.
//! This worker is safe by default: it only records service health and never enables hardware mode.

#[path = "../config.rs"]
mod config;
#[path = "../database.rs"]
mod database;

use config::BackendConfig;
use database::Database;
use std::time::Duration;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let cfg = BackendConfig::from_env();

    let db = match Database::connect(&cfg.database_url, cfg.mysql_enabled).await {
        Ok(Some(db)) => Some(db),
        Ok(None) => {
            tracing::info!("MySQL disabled; cron worker will run health-only mode");
            None
        }
        Err(err) => {
            tracing::error!(error = %err, "Unable to connect to MySQL");
            std::process::exit(2);
        }
    };

    let interval_seconds = std::env::var("CL1_CRON_INTERVAL_SECONDS")
        .ok()
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or(300)
        .max(60);

    loop {
        if let Some(database) = &db {
            if let Err(err) = database.record_heartbeat("cl1-cron-worker").await {
                tracing::error!(error = %err, "Failed to record heartbeat");
            } else {
                tracing::info!("Recorded MySQL heartbeat");
            }
        }
        tokio::time::sleep(Duration::from_secs(interval_seconds)).await;
    }
}
