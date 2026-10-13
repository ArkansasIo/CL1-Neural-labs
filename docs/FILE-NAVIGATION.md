# File Navigation Convention

> [Documentation manifest](./DOCUMENTATION-MANIFEST.md) · [Project README](../README.md)

Markdown documentation is treated as a navigable index into implementation.

## Header flags

```text
STATUS: implemented | partial | planned | reference
SOURCE: path/to/source.ts; path/to/source.py
API: path/to/client.ts; /api/example
TESTS: path/to/test.py
BACK: ../docs/parent.md
NEXT: ../docs/next.md
```

## Link behavior

- Use repository-relative links for source files, tests, schemas, and related Markdown.
- Link from docs to code when explaining implementation.
- Link from code back to docs in file-level comments.
- Link API contracts to server implementation when that implementation exists.
- Mark planned endpoints explicitly.
- Keep links stable when moving files.

Flags are navigation metadata, not feature toggles. They do not grant physical hardware access or stimulation permission.
