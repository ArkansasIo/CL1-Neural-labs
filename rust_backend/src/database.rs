use serde::Serialize;
use sqlx::{mysql::MySqlPoolOptions, MySqlPool};

#[derive(Clone)]
pub struct Database {
    pub pool: MySqlPool,
}

#[derive(Debug, Serialize)]
pub struct DatabaseHealth {
    pub enabled: bool,
    pub connected: bool,
}

impl Database {
    pub async fn connect(database_url: &str, enabled: bool) -> Result<Option<Self>, sqlx::Error> {
        if !enabled {
            return Ok(None);
        }
        let pool = MySqlPoolOptions::new()
            .max_connections(10)
            .connect(database_url)
            .await?;
        Ok(Some(Self { pool }))
    }

    pub async fn health(&self) -> DatabaseHealth {
        let connected = sqlx::query_scalar::<_, i32>("SELECT 1")
            .fetch_one(&self.pool)
            .await
            .is_ok();
        DatabaseHealth { enabled: true, connected }
    }

    pub async fn record_heartbeat(&self, service: &str) -> Result<(), sqlx::Error> {
        sqlx::query("INSERT INTO service_heartbeats (service_name, heartbeat_at) VALUES (?, UTC_TIMESTAMP())")
            .bind(service)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn record_experiment_run(
        &self,
        experiment_name: &str,
        ticks: u64,
        observations: u64,
        stims_applied: u64,
        stims_rejected: u64,
        summary_json: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT INTO experiment_runs (experiment_name, ticks_requested, observations, stims_applied, stims_rejected, summary_json) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(experiment_name)
        .bind(ticks)
        .bind(observations)
        .bind(stims_applied)
        .bind(stims_rejected)
        .bind(summary_json)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
