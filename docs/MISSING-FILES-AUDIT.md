# Repository Completeness Audit

**Purpose:** identify missing required project paths, unresolved relative frontend imports, broken relative Markdown links, and the absence of a frontend test setup.

## Run locally

From the repository root:

```bash
python scripts/audit_repository.py
python scripts/audit_repository.py --json
```

The checker uses only Python's standard library. It exits non-zero when a configured required path or a relative source import is missing. Broken documentation links are warnings. A frontend test-coverage gap is reported separately because it is a completeness concern, not necessarily a build blocker.

## Confirmed gap from the repository inventory

- **Frontend automated tests and test command:** the current package scripts provide development, build, preview, clean, and TypeScript lint/type-check commands, but no frontend test command; the tracked tree does not contain a frontend unit/component test suite. The GitHub Actions release workflow therefore checks compilation/build and Python/sandbox tests, but not frontend behavior.

## High-priority files to add after implementation review

These are requirements to evaluate, not assertions that a filename alone makes a feature complete:

| Priority | Missing coverage or artifact | Why it matters |
|---|---|---|
| P0 | Frontend unit/component tests and a package test script | Protect simulator state, settings, menus, and safety indicators against regressions. |
| P1 | Server/API tests for status, stimulation validation, configuration, and WebSocket framing | Verify actual routes and binary message format rather than relying on documentation. |
| P1 | A machine-readable API contract (for example, OpenAPI plus a documented WebSocket frame schema) | Keeps UI clients, simulator endpoints, and SDK adapters aligned. |
| P1 | Replay/import validation tests for recording formats and provenance | Prevents malformed or synthetic data from being mistaken for physical recordings. |
| P1 | Cross-layer safety tests for physical read-only defaults and stimulation gating | Ensures UI settings cannot be mistaken for a hardware interlock. |
| P2 | Browser-level smoke tests for boot overlay, navigation, settings, and responsive layout | Covers behavior that type-checking cannot establish. |

## Scope and limits

This static checker cannot determine whether a feature is scientifically valid, whether a physical CL1 device is connected, whether a dependency is safe, or whether code works at runtime. It does not treat optional architecture ideas as mandatory files. Build, Python unit tests, browser tests, API contract tests, and hardware safety validation remain separate gates.

Physical CL1 integration must remain disabled unless an authorized, validated adapter and independent safety procedures exist. The project simulator and SDK simulator must be labeled as simulations.
