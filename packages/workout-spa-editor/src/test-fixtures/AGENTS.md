<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/test-fixtures/`

## Purpose

JSON fixtures used by tests in the SPA. Distinct from `src/test-utils/`: this directory holds raw data, that one holds the in-memory adapters that consume it.

## Key Files

- `dexie-pre-redesign.json` — pre-migration Dexie dump used by migration-test fixtures.

## For AI Agents

### Working In This Directory

1. Keep fixtures stable. Migration tests assert exact post-upgrade shapes; rewriting a fixture changes the assertion target.
2. Add a comment header at the top of each JSON file describing which test uses it.

## Dependencies

### Internal

- Consumed by `src/adapters/dexie/dexie-v*-migration.test.ts`.

<!-- MANUAL: -->
