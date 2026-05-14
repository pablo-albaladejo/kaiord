<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src

## Purpose

Source tree of `@kaiord/fit`. Public entry (`index.ts`) re-exports the pre-built
`fitReader`/`fitWriter` and the `createFitReader`/`createFitWriter` factories.
Internals are organized hexagonally: `adapters/` implements the FIT⇄KRD mapping,
`types/` declares shared types/aliases for the package, `test-utils/` holds
fixture loaders, and `tests/` runs round-trip + unit suites.

## Key Files

| File       | Description                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `index.ts` | Public surface — exports `fitReader`, `fitWriter`, `createFitReader(logger?)`, `createFitWriter(logger?)`, and shared types. |

## Subdirectories

| Directory     | Purpose                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `adapters/`   | FIT⇄KRD reader/writer implementation, organized by FIT message type (see `adapters/AGENTS.md`) |
| `test-utils/` | Fixture loaders and shared test helpers (see `test-utils/AGENTS.md`)                           |
| `tests/`      | Unit + round-trip tests anchored on shared `test-fixtures/` (see `tests/AGENTS.md`)            |
| `types/`      | Package-local TS aliases and `@garmin/fitsdk` shape helpers (see `types/AGENTS.md`)            |

## For AI Agents

### Working In This Directory

- This package is an adapter — it depends on `@kaiord/core` only.
- Public exports MUST come through `index.ts`; never re-export internals
  via side-channel paths.
- Use the factory variants when a custom logger is required; use the
  pre-built singletons for cheap one-offs.

### Testing Requirements

Coverage target 80% for `@kaiord/fit`. Round-trip tolerances: time ±1s,
power ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm. Title rule (`R-ItTitleShould`)
and AAA rule (`R-ItBodyAAA`) apply.

### Common Patterns

- Strategy injection at the boundary; internals work in plain types.
- Per-message mapping modules live under `adapters/` (one folder per FIT
  message type) so coverage can be reasoned about per-message.

## Dependencies

### Internal

- `@kaiord/core` — port contracts, KRD types/schemas, logger interface.

### External

- `@garmin/fitsdk` — FIT binary encode/decode.

<!-- MANUAL: -->
