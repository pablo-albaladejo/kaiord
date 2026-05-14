<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `scripts/`

## Purpose

Package-local maintenance scripts. The monorepo's repo-wide scripts (archive lints, no-zustand-writethrough, no-pii-leakage, no-library-dual-mount, session-match-id-shape) live at `../../scripts/` at the repo root.

## Key Files

- `generate-fitsdk-minimal.mjs` — generates `src/lib/fitsdk-minimal/profile.js` from the full Garmin FIT SDK profile, keeping only the messages and fields the SPA's FIT-import path needs. Run via `pnpm generate:fitsdk-minimal`.

## For AI Agents

### Working In This Directory

1. **Scripts are Node ESM (`.mjs`).** Run with `pnpm`, not bare `node`.
2. **Per the repo-wide convention,** non-trivial scripts have a co-located `*.test.mjs` using `node:test`. Add one if this script grows.
3. **The generator output is checked in.** Re-run after the FIT SDK upgrades and commit the diff.

## Dependencies

### External

- The Garmin FIT SDK profile data (sourced via the workspace).

<!-- MANUAL: -->
