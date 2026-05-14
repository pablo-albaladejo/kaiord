<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# tcx-files

## Purpose

Placeholder directory containing only a README. The actual `.tcx` XML fixture files live at the monorepo root in `test-fixtures/tcx/` and are loaded by `loadTcxFixture(filename)` from `@kaiord/core/test-utils`. This folder exists historically; do not add new fixtures here.

## Key Files

| File        | Description                                                                                                                                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md` | Explains the indirection: fixtures live at `<monorepo-root>/test-fixtures/tcx/`, are vendored examples covering structured workouts (HR targets, individual steps, repeat steps, custom target values), and are consumed via `loadTcxFixture(name)`. |

## For AI Agents

### Working In This Directory

- DO NOT place `.tcx` files in this directory. New fixtures go in `<monorepo-root>/test-fixtures/tcx/`.
- TCX fixtures should pass the official Garmin `TrainingCenterDatabasev2.xsd` schema (vendored in `<package>/schema/`). The `@kaiord/tcx` validator enforces this.

<!-- MANUAL: -->
