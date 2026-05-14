<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/lib/fitsdk-minimal/`

## Purpose

Generated minimal FIT SDK profile. The full Garmin FIT SDK profile is large and tree-shake-hostile; this directory holds a hand-trimmed subset that covers only the messages and fields the SPA's FIT-import path needs.

## Key Files

- `profile.js` — generated; regenerate with `pnpm generate:fitsdk-minimal` (see `../../../scripts/generate-fitsdk-minimal.mjs`).

## For AI Agents

### Working In This Directory

1. **Do NOT hand-edit `profile.js`.** It is regenerated.
2. To extend the minimal set, edit `scripts/generate-fitsdk-minimal.mjs` and rerun the generator.

## Dependencies

### Internal

- Consumed by `@kaiord/fit` indirectly via the SPA build.

<!-- MANUAL: -->
