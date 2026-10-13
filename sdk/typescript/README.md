# TypeScript Client SDK

The TypeScript SDK is the stable client boundary between the UI and project services. Existing implementation is under `src/client/`.

## Current clients

- `clusterClient.ts`: cluster status and device control requests.
- `teachingClient.ts`: Pong teaching event/state helpers.
- `educationClient.ts`: curriculum and symbolic math UI integration.
- `neurocognitiveClient.ts`: node traces and computational self-explanations.

## Contract rules

- Keep request and response types explicit.
- Surface HTTP errors and timeouts to the caller.
- Add cancellation and bounded retry/backoff before production deployment.
- Do not represent local-only client state as server-persisted data.
- Include source provenance in all telemetry and result payloads.
- Avoid importing Python or vendor SDK concepts directly into browser code.
