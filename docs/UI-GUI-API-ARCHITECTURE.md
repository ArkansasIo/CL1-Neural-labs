STATUS: implemented
SOURCE: ../src/App.tsx; ../src/components/StudioCommandBar.tsx
API: ../server.ts; ../src/client/
TESTS: not yet automated
BACK: ./DOCUMENTATION-MANIFEST.md
NEXT: ./REAL-CL1-INTEGRATION.md

# CL1 Neural Labs UI / GUI / API Architecture

The application uses a command-center layout with a consistent navigation model across simulation, SDK-simulator, replay, and physical-read-only workflows.

## Menu hierarchy
- Workspace: 2D MEA Grid, 3D Spatial View, Neural Analytics
- Experiments: Wetware Experiments, Stimulation Workbench, Maze & Pathfinding
- Teaching: Math Teaching, Neurocognitive AI, SDK / Code
- Data: SQL & Datasets, CL1 Visualizer

## Global controls
- Settings and Options / quick settings
- Hardware environment selection
- Layout selection
- API base URL field
- Startup auto-connect switch
- Physical integration read-only switch
- Simulation, recording, and research controls

## Hardware environments
1. Project Simulator — project-level virtual hardware.
2. Official SDK Simulator — Cortical Labs SDK simulator.
3. Recording Replay — previously captured recordings.
4. Physical CL1 / Read Only — authorized physical integration with writes and stimulation separately gated.

Changing the UI mode does not grant physical permissions. Stimulation remains an explicit authorization boundary.

## UI design rules
- Menus and sub-menus should expose the same feature taxonomy as the API.
- Forms should show units, valid ranges, and current source/provenance.
- Hardware-affecting operations require an explicit confirmation surface.
- Physical mode must display a persistent read-only indicator until separate authorization is completed.
- Settings are configuration; operational actions belong in workbenches.
- Layouts are presentation preferences and must not change experiment semantics.

## API surface convention
Use resource-oriented endpoint groups such as `/api/status`, `/api/recordings`, `/api/experiments`, `/api/analysis`, `/api/hardware`, `/api/datasets`, `/api/teaching`, `/api/auth`, and `/api/audit`.

The UI may expose API inspector/settings fields, but endpoint availability must be verified against the running server before being presented as implemented.

## Safety boundary
The UI is not a physical safety interlock. A software emergency-stop state can prevent application-level commands, but physical stimulation safety must remain enforced by the authorized hardware/control layer and approved operating procedures.