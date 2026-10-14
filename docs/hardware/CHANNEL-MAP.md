# Virtual 64-Channel MEA Map

**Scope:** software-model reference only. This file is not a vendor-verified electrical schematic, pinout, connector map, or physical CL1 hardware specification.

## Channel indexing

The project models 64 channel IDs from 0 through 63 in an 8×8 array. UI components may map channel IDs to rows and columns according to their own display conventions; confirm indexing in the source before comparing views.

The current Python virtual hardware profile defines:

| Role | Channel IDs | Software behavior |
|---|---|---|
| Grounded/reserved | 0, 7, 56, 63 | Excluded from virtual stimulation requests |
| Reference | 4 | Excluded from virtual stimulation requests |
| Other modeled channels | Remaining IDs from 0–63 | Recording/simulation channels |

Source of truth for the software model: `python/cl1_neural_lab/types.py` and `python/cl1_neural_lab/virtual_hardware.py`. The TypeScript simulator has its own constants in `src/types/cl1.ts`; changes should be kept consistent and covered by tests.

## Safety and interpretation

- The profile's 25 kHz sample rate and 0.195 µV/sample-unit conversion are project assumptions until checked against authoritative device/API documentation.
- This mapping does not establish physical electrode wiring or hardware identity.
- Physical stimulation must not be enabled from this map. The virtual adapter explicitly rejects physical modes.
- When importing real recordings, use the official API's channel metadata and preserve provenance instead of inferring physical channels from this project map.
