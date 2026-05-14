<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# zwift-files

## Purpose

Placeholder directory containing only a README. The actual `.zwo` Zwift workout fixture files live at the monorepo root in `test-fixtures/zwo/` and are loaded by `loadZwoFixture(filename)` from `@kaiord/core/test-utils`. This folder exists historically; do not add new fixtures here.

## Key Files

| File        | Description                                                                                                                                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md` | Explains the indirection: fixtures live at `<monorepo-root>/test-fixtures/zwo/`, are regenerated from FIT sources by `scripts/generate-zwift-fixtures.ts` (FIT → KRD → ZWO), and are validated against `zwift-workout.xsd` (in `<package>/schema/`). |

## For AI Agents

### Working In This Directory

- DO NOT place `.zwo` files in this directory. New fixtures go in `<monorepo-root>/test-fixtures/zwo/`. To add one, list the source FIT in `scripts/generate-zwift-fixtures.ts`'s `fitFiles` array and run the generator.
- All ZWO fixtures should pass `zwift-workout.xsd` validation enforced by `@kaiord/zwo`.

<!-- MANUAL: -->
