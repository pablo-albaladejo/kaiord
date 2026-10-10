<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `scripts/`

## Purpose

Package-local maintenance scripts. The monorepo's repo-wide scripts (archive lints, no-zustand-writethrough, no-pii-leakage, no-library-dual-mount, session-match-id-shape) live at `../../scripts/` at the repo root.

## Key Files

- `generate-og-image.mjs` — renders the SPA's Open Graph image.

## For AI Agents

### Working In This Directory

1. **Scripts are Node ESM (`.mjs`).** Run with `pnpm`, not bare `node`.
2. **Per the repo-wide convention,** non-trivial scripts have a co-located `*.test.mjs` using `node:test`. Add one if this script grows.

## Dependencies

### External

- None beyond the workspace toolchain.

<!-- MANUAL: -->
