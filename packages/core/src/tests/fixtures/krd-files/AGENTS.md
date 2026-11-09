<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# krd-files

## Purpose

Placeholder directory containing only a README. The actual `.krd` binary fixture files live at the monorepo root in `test-fixtures/krd/` and are loaded by `loadKrdFixture(filename)` from `@kaiord/core/test-utils`. This folder exists historically; do not add new fixtures here.

## Key Files

| File        | Description                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `README.md` | Explains the indirection: fixtures live at `<monorepo-root>/test-fixtures/krd/`, and are consumed via `loadKrdFixture(name)`. |

## For AI Agents

### Working In This Directory

- DO NOT place `.krd` files in this directory. New fixtures go in `<monorepo-root>/test-fixtures/krd/`. If you need a NEW one, add it there (there is no generator script; create the file by converting a FIT with `kaiord convert`).
- The `FIXTURE_NAMES` constant in `src/test-utils/fixtures.ts` is the canonical list (INDIVIDUAL_STEPS, REPEAT_STEPS, CUSTOM_TARGET_VALUES, REPEAT_GREATER_THAN). Add new fixtures there too.

<!-- MANUAL: -->
