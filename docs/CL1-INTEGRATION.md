# CL1 Integration

## Purpose

This document defines the boundary between the CL1 Neural Labs software simulator and a future physical Cortical Labs CL1 integration.

## Current state

The repository already contains a CL1-style simulated server and a neural-culture simulator.

The server exposes:

- `GET /_/config`
- `GET /api/status`
- `POST /api/stim`
- WebSocket `/_/ws/overview`

These endpoints are development interfaces. They do not establish that the application is connected to physical CL1 hardware.

## Adapter architecture

Use an explicit adapter:

```
CL1 API / device
      |
      v
CL1Source
      |
      v
NeuralFrame
      |
      +--> spike detector
      +--> recording
      +--> analytics
      +--> visualization
```

The simulator should implement the same conceptual source contract.

## Acquisition responsibilities

A physical adapter should be responsible for:

- establishing the authorized CL API session
- identifying the connected device
- validating channel configuration
- receiving recordings
- translating device-native records into repository types
- handling connection failures
- preserving timestamps
- preserving stimulation provenance
- shutting down cleanly

It should not contain UI-specific code.

## Stimulation responsibilities

Physical stimulation must be isolated behind a safety-aware interface.

Required controls include:

- channel validation
- waveform validation
- current limits
- charge limits
- timing validation
- device state validation
- explicit operator confirmation
- emergency stop
- audit logging

The simulator may expose stimulation for experimentation, but simulator values must not be assumed safe for physical equipment.

## Data provenance

Every physical recording should identify:

- device identifier
- acquisition start/end
- API/software version
- channel configuration
- sampling configuration
- culture identifier where applicable
- experiment identifier
- stimulation configuration
- preprocessing configuration

## Recommended implementation sequence

1. Define a common neural-source interface.
2. Adapt the existing simulator to that interface.
3. Add a dataset replay source.
4. Add integration tests using recorded data.
5. Add the official CL API adapter.
6. Validate read-only recording first.
7. Add stimulation only after independent safety validation.
