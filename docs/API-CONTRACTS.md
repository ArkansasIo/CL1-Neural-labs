# API Contracts

**Status:** design contract for the development simulator. It is not a vendor API specification and does not authorize physical hardware control.

## Server endpoints

The TypeScript development server listens on port 3000 by default. Verify actual availability against `server.ts` before treating a route as implemented.

| Method | Path | Purpose | State-changing |
|---|---|---|---|
| GET | `/api/status` | Server and simulator status | No |
| GET | `/api/cluster` | Virtual cluster topology/status (Python server, port 3001) | No |
| POST | `/api/cluster/connect` | Connect virtual cluster instances | Yes, virtual only |
| POST | `/api/cluster/pause/{slot}` | Pause a virtual node | Yes, virtual only |
| POST | `/api/cluster/resume/{slot}` | Resume a virtual node | Yes, virtual only |
| GET | `/api/database/tables` | List in-memory research tables | No |
| GET | `/api/database/{table}` | Read a named table | No |

The route table is a target/documentation index, not proof every TypeScript route exists. The Python cluster server is a separate process and is not automatically mounted under the TypeScript server.

## WebSocket overview stream

- URL: `ws://HOST:3000/_/ws/overview` for the TypeScript simulator.
- Transport: binary messages for sample chunks and JSON text messages for status/reset metadata.
- Intended mode: synthetic project simulation only.
- Client must validate message type, length, and protocol version before decoding.
- Disconnect must stop client-side timers and event listeners.
- No message in this protocol authorizes physical stimulation.

The current TypeScript server's sample chunk is 64 channels × 3 signed 16-bit values per channel = 384 bytes, encoded in host little-endian order on supported CI platforms. The fields are minimum sample, maximum sample, and bit flags. Bit 0 denotes a spike and bit 1 denotes a virtual stimulation event. Any protocol evolution must add an explicit version and tests.

## Safety and provenance

- Mark all generated data as `synthetic_model` or `sdk_simulator`, never as physical recordings.
- Imported recordings require a source identifier and provenance record; filenames alone are not evidence of origin.
- Physical access must remain unavailable until a separately validated official adapter, authorization, audit trail, and independent hardware safety controls are implemented.
- UI read-only state is not a hardware safety interlock.
