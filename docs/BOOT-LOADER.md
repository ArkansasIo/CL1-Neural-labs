# CL1 Neural Labs Boot Loader

<!-- STATUS: implemented | SOURCE: ../src/components/LinuxBootLoader.tsx, ../public/branding/cl1-neural-labs-logo.svg | API: ../src/config/buildInfo.ts | TESTS: ../.github/workflows/release-gates.yml | BACK: INDEX.md | NEXT: BUILD-IDENTITY.md -->

The application starts with a Linux-style text console. It is application UI, not BIOS, CMOS, firmware, or a physical CL1 boot process.

## Boot stages
1. **CORE SYSTEM** — initializes the UI runtime.
2. **BUILD IDENTITY** — displays version and build ID.
3. **VIRTUAL HARDWARE** — selects the 64-channel project simulator.
4. **DATA PIPELINE** — initializes simulation/replay boundaries.
5. **GUI / API** — confirms the application API version.
6. **SAFETY GATES** — visibly confirms physical stimulation is locked.

## Source navigation
- [Boot loader](../src/components/LinuxBootLoader.tsx)
- [Logo](../public/branding/cl1-neural-labs-logo.svg)
- [Build identity](../src/config/buildInfo.ts)
- [Main application](../src/App.tsx)
