<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# tests

## Purpose

Test-only utilities and fixtures: rosie factory builders for domain types and shared test helpers. Most of these are surfaced to other packages via `@kaiord/core/test-utils`.

## Subdirectories

| Directory   | Purpose                                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fixtures/` | Rosie factory builders + binary fixture READMEs (the actual `.fit`/`.tcx`/`.zwo` files live in the monorepo-root `test-fixtures/`) (see `fixtures/AGENTS.md`) |
| `helpers/`  | Mock logger and shared test helpers (see `helpers/AGENTS.md`)                                                                                                 |

## For AI Agents

### Working In This Directory

- The round-trip validation use case lives in `../application/round-trip/` (moved out of `tests/` because it is part of the PUBLIC API, consumed at runtime by `@kaiord/cli` and `@kaiord/mcp`). This folder holds only fixtures and test infrastructure.
- Test FILES (`*.test.ts`) live next to source — they do NOT live in this folder. This folder is for test infrastructure shared across files.

<!-- MANUAL: -->
