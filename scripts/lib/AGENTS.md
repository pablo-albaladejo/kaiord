<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# lib

## Purpose

Shared helpers used by mechanical lint guards under `scripts/`. Pulled out
of individual guards so common scanning/parsing logic is unit-testable in
one place.

## Key Files

| File                     | Description                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `find-package-files.mjs` | Enumerate files under `packages/**` honoring `.gitignore` and `node_modules` exclusion. Used by every guard that walks the workspace.             |
| `strip-jsonc.mjs`        | Strip comments/trailing commas so `JSON.parse` can consume `.json` files that have JSONC syntax (e.g. `tsconfig.json`, `.changeset/config.json`). |

## For AI Agents

### Working In This Directory

- Helpers MUST stay pure and dependency-free (Node stdlib only).
- A helper is "shared" only when ≥2 guards consume it. Otherwise inline.
- Every helper file MUST have a sibling `*.test.mjs` exercising the public
  contract.

### Testing Requirements

- `node --test scripts/lib/*.test.mjs` is part of `pnpm test:scripts`.
- 100% statement coverage is the de-facto target for this folder (helpers
  are tiny and high-leverage).

### Common Patterns

- Exports are plain functions; no factory wrappers.
- File-system reads accept an optional root for testability.

## Dependencies

### Internal

Consumed by sibling `../check-*.mjs` guards.

### External

Node 22 stdlib only.

<!-- MANUAL: -->
