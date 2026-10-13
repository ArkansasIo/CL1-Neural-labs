# Virtual Hardware Engineering Package

This directory contains conceptual software schematics and UML for the virtual device model. These are not electrical drawings, PCB files, or validated physical CL1 internals.

## System block schematic

```mermaid
flowchart LR
  SIM[Simulator] --> DEV[Virtual device model]
  REP[Recorded-data replay] --> DEV
  CL[Optional official CL API adapter] -. not implemented .-> DEV
  DEV --> REC[Recording and provenance]
  REC --> ANA[Analysis and graph export]
  DEV <--> API[Cluster API]
  API <--> DB[In-memory store today / SQL schema]
  API <--> UI[TypeScript UI]
```

## UML class view

```mermaid
classDiagram
  class VirtualHardwareProfile {
    +profile_id: str
    +channel_count: int
    +nominal_sample_rate_hz: int
    +grounded_channels: tuple
    +reference_channels: tuple
  }
  class VirtualDeviceState {
    +device_id: str
    +mode: DeviceMode
    +connected: bool
    +recording: bool
    +emergency_stop_latched: bool
  }
  class VirtualCL1Hardware {
    +connect()
    +disconnect()
    +describe()
    +start_recording(label)
    +stop_recording()
    +request_stimulation(channels, operator_confirmed)
    +emergency_stop()
  }
  class DeviceBox {
    +slot: int
    +device_id: str
    +online: bool
  }
  class VirtualCL1Cluster {
    +connect_all()
    +disconnect_all()
    +pause_device(slot)
    +resume_device(slot)
    +status()
    +topology()
  }
  VirtualCL1Hardware --> VirtualHardwareProfile
  VirtualCL1Hardware --> VirtualDeviceState
  DeviceBox *-- VirtualCL1Hardware
  VirtualCL1Cluster o-- DeviceBox
```

## Measurement and wiring caveat

The repository models a 64-channel namespace and an 8×8 visualization grid. Those are software profile assumptions and must not be interpreted as physical connector pins or verified electrode coordinates. Physical power, PCB, connector, isolation, and ADC schematics require manufacturer-authorized documentation and qualified hardware engineering.

## Safety and provenance

Virtual stimulation is an audit event only and is never dispatched to a physical device. The software emergency stop is not a physical safety circuit. Every future adapter must label whether results are simulated, replayed, imported, or live.
