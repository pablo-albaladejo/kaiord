<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# tests

## Purpose

Test-only utilities and fixtures: rosie factory builders for domain types, structural comparers used by round-trip validation, and the `validateRoundTrip` use case (which IS exported publicly because adapter packages re-use it). Most of these are surfaced to other packages via `@kaiord/core/test-utils`.

## Subdirectories

| Directory     | Purpose                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fixtures/`   | Rosie factory builders + binary fixture READMEs (the actual `.fit`/`.tcx`/`.zwo` files live in the monorepo-root `test-fixtures/`) (see `fixtures/AGENTS.md`) |
| `helpers/`    | Mock logger and shared test helpers (see `helpers/AGENTS.md`)                                                                                                 |
| `round-trip/` | `validateRoundTrip` use case + structural KRD comparers (sessions/laps/records/workout-steps) (see `round-trip/AGENTS.md`)                                    |

## For AI Agents

### Working In This Directory

- Despite the folder name, `tests/round-trip/validate-round-trip.ts` is part of the PUBLIC API — it's re-exported from `src/index.ts` because `@kaiord/fit` and `@kaiord/all` need it for their integration tests. Treat it as a use case, not as a test file.
- Test FILES (`*.test.ts`) live next to source — they do NOT live in this folder. This folder is for test infrastructure shared across files.

<!-- MANUAL: -->
