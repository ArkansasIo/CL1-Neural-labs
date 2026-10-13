# Maze Teaching and Pathfinding

## Teaching goals
- Contrast uninformed search (BFS, DFS) with informed search (A*, greedy best-first).
- Compare route cost, expanded/visited states, and success rate.
- Teach graph representation, heuristics, weighted terrain, dynamic replanning, exploration, and multi-agent coordination.
- Keep all maze activity virtual and reproducible by seed.

## Implemented
- Python library: BFS, DFS, Dijkstra, A*, greedy best-first, bidirectional BFS.
- Python randomized depth-first maze generator.
- TypeScript client trial recorder and browser teaching view.
- Seeded square-grid maze visualiser with start/goal, visited states, and path overlay.
- Variant catalogue with 15 common families and extensions.

## Maze families covered by the catalogue
Perfect/DFS-carved, braided, rooms-and-corridors, recursive division, weave, hexagonal, triangular, weighted terrain, dynamic obstacles, multi-goal/waypoint, multi-agent, 3D voxel, time-expanded, unknown-map exploration, and cyclic labyrinths.

The first UI implementation currently renders perfect square-grid mazes. Hex/triangular/3D and dynamic or multi-agent variants require separate adjacency/state models; the selector explains the concepts and must not imply those solvers are already implemented.

## Algorithms
| Algorithm | Complete? | Optimal on unit-cost grid? | Typical lesson |
|---|---|---|---|
| BFS | Yes, finite graph | Yes | Level-by-level exploration |
| DFS | Yes with visited set | No | Backtracking and dead ends |
| Dijkstra | Yes, non-negative costs | Yes | Cost-aware shortest paths |
| A* | Yes with admissible heuristic | Yes under standard conditions | Heuristic-guided search |
| Greedy best-first | Not guaranteed optimal | No | Heuristic can mislead |
| Bidirectional BFS | Yes on suitable unweighted graph | Yes | Search from both ends |

## Biological measurement import
The Python importer reads CL API HDF5 recordings using the official SDK's `RecordingView`, extracting recording attributes, raw sample shape, spike events and stimulation events. It is read-only and does not send stimulation commands.

The importer defaults to `unverified_recording_file`. Verify source system ID, chip/cell-batch metadata, simulator flag, and lab records before reclassifying data as physical biological measurement. SDK simulator random/replay output must remain tagged as simulated/replayed, not biological.

## Recommended data provenance fields
- `source_kind`: `physical_cl1`, `sdk_simulator`, `dataset_replay`, or `synthetic_model`
- `source_system_id`, `project_id`, `chip_id`, `cell_batch_id`
- `recording_file_hash`, `recording_started_at`, `sampling_frequency_hz`
- `operator_id`, `protocol_version`, `analysis_version`
- `provenance_verified`, `verification_notes`

## Safety boundary
Measurement import and analysis are separate from stimulation. The client never talks directly to physical hardware. Any future stimulation control must use the official API and a separately reviewed safety adapter with validation, operator authorization, interlocks, audit logging, and emergency stop.
