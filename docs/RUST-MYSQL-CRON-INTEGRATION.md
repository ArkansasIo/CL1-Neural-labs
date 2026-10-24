# Rust + MySQL + Cron + TypeScript Integration

## Services

- TypeScript/React UI: existing Vite application.
- Rust simulation API: `rust_backend`, default `http://127.0.0.1:8100`.
- MySQL: optional persistence database, schema under `mysql/`.
- Python cron runner: `python/cron_jobs.py`.
- Rust cron worker: `cl1-cron-worker`.

## Environment

Copy `config/rust-backend.env.example` into the deployment environment and set real credentials outside Git.
For the frontend, set `VITE_CL1_RUST_BACKEND_URL=http://127.0.0.1:8100` or the deployed Rust API URL.

## MySQL

Start development MySQL with:

```text
docker compose -f docker-compose.mysql.yml up -d
```

Then enable Rust persistence:

```text
CL1_MYSQL_ENABLED=true
CL1_DATABASE_URL=mysql://cl1:<password>@127.0.0.1:3306/cl1_neural_labs
```

## Rust backend

```text
cd rust_backend
cargo run --bin cl1-server
```

The existing REST and WebSocket API remains available. The new database module provides health, heartbeat, and experiment-run persistence primitives.

## Rust cron worker

```text
cd rust_backend
CL1_MYSQL_ENABLED=true cargo run --bin cl1-cron-worker
```

The worker writes a service heartbeat every five minutes by default. It does not enable physical hardware mode.

## Python cron runner

```text
python3 python/cron_jobs.py --job heartbeat --once
```

For a recurring process, use the supplied `scripts/cron/cl1-heartbeat.cron` or an external scheduler.

## TypeScript connection

Import `src/services/rustBackend.ts` from React components or application services:

```ts
import { rustStatus, rustStimulate } from './services/rustBackend';
```

The service exposes Rust status/configuration, stimulation, and experiment discovery through typed functions.

## Safety boundary

The Rust implementation is a software simulator. Database persistence and scheduled jobs do not grant physical-device access. Hardware control must remain explicitly authorized and fail-closed.
