<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/application/profile/helpers/`

## Purpose

Helpers extracted from profile use cases.

## Key Files

- `profile-factory.ts` — builds canonical `Profile` shapes with sane defaults (sport zones, calendar prefs).
- `profile-updater.ts` — patch helper used by `update-profile` and active-id mutations.
- `profile-utils.ts` — derived getters (e.g. resolve active profile).
- `sport-zone-updater.ts` — shared mutation surface used by the `zones/` subdirectory.

## For AI Agents

### Working In This Directory

1. Pure functions, no side effects.
2. Consumers are sibling use cases — no cross-domain imports.

## Dependencies

### Internal

- `../../../types/profile`, `../../../types/sport-zones`.

<!-- MANUAL: -->
