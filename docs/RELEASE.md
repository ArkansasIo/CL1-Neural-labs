# Release Process

<!-- STATUS: IMPLEMENTED — release policy | SOURCE: package.json; python/pyproject.toml; src/config/buildInfo.ts; public/build-info.json | TESTS: TESTING-RELEASE.md | BACK: ../README.md | NEXT: PROJECT.md; BUILD-IDENTITY.md -->

## Release line

Current intended release line: **0.4.x**. Release numbers must match the npm package, Python package, build identity, and release notes.

## Stages

1. **Alpha:** run type-check, frontend production build, Python unit tests, lint where configured, and safety-boundary tests.
2. **Beta:** repeat alpha gates on a clean checkout; exercise simulator, replay, and SDK simulator separately; review data provenance, documentation links, and known limitations.
3. **Release candidate:** freeze changes, record commit SHA, test results, version, build ID, and known issues.
4. **Release:** publish a tag and release notes only after required checks pass. Do not call a release verified if the checks have not actually run.

## Release restrictions

- CI must never require or connect to physical CL1 hardware.
- Physical-device checks are manual, authorized, and documented separately.
- Stimulation is not part of automated release tests.
- SDK simulator data is synthetic or replayed; it is not a biological experiment and may not respond to stimulation like living tissue.
- A software release is not hardware safety certification or institutional research approval.

## Release checklist

- [ ] Package and build versions agree.
- [ ] Alpha gates pass.
- [ ] Beta gates pass.
- [ ] No secrets or real-device credentials are committed.
- [ ] Provenance labels are preserved in exports.
- [ ] Hardware and stimulation boundaries are documented.
- [ ] README, wiki draft, and project plan links resolve.
- [ ] Changelog/release notes include commit SHA and test evidence.
- [ ] Tag and GitHub release are published by an authorized maintainer.
