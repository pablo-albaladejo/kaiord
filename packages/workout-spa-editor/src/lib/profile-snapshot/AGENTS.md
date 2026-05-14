<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/lib/profile-snapshot/`

## Purpose

Pure helpers for the profile-snapshot push flow (used by `hooks/use-profile-snapshot-push`).

## Key Files

- `profile-to-snapshot.ts` / `.test.ts` — maps a `Profile` row into the bridge-protocol `ProfileSnapshot` shape (sport zones flattened, threshold values normalized).

## For AI Agents

### Working In This Directory

- Pure functions. No bridge calls — that's `adapters/bridge/`.

## Dependencies

### Internal

- `../../types/profile`, `../../types/sport-zones`.

<!-- MANUAL: -->
