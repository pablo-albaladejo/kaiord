<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# test-fixtures

## Purpose

Shared, real-world workout fixtures used across every format adapter for
round-trip tests and CLI smoke tests. Each fixture exists in multiple
formats so that round-trip identity (FIT → KRD → TCX → KRD → FIT, etc.)
can be verified with the canonical tolerances: time ±1s, power ±1W or
±1%FTP, HR ±1bpm, cadence ±1rpm.

## Key Files

| File        | Description                                |
| ----------- | ------------------------------------------ |
| `README.md` | Index of fixtures and what each one covers |

## Subdirectories

| Directory | Purpose                                                                         |
| --------- | ------------------------------------------------------------------------------- |
| `fit/`    | Binary FIT files (`*.fit`) — Garmin-native workouts                             |
| `tcx/`    | TCX XML files (`*.tcx`) — TrainingPeaks-style export                            |
| `zwo/`    | Zwift workout XML files (`*.zwo`)                                               |
| `gcn/`    | Garmin Connect Native JSON payloads (`*.gcn`); paired `Input`/`Output` variants |
| `krd/`    | KRD JSON (canonical) — the round-trip pivot format                              |

Each subdirectory contains 4–5 files. Pairings are by base name:
e.g. `WorkoutIndividualSteps.{fit,krd,tcx,zwo}` are intended to be
round-trip-equivalent across adapters.

## For AI Agents

### Working In This Directory

- **Treat fixtures as ground truth**: don't edit a fixture to "fix" a test.
  If a round-trip violates a tolerance, the bug is in the adapter — fix
  the adapter.
- **Add new fixtures sparingly**: every new fixture multiplies CI cost in
  every adapter. Prefer extending an existing one unless you're covering
  a distinct shape (e.g. nested repeats, custom targets, multi-sport).
- **Name fixtures by what they exercise**: `WorkoutCustomTargetValues`,
  `WorkoutRepeatGreaterThanStep`, etc. Avoid timestamps or PR numbers.
- **Load fixtures via `@kaiord/core/test-utils`** rather than direct `fs`
  reads — the test-utils package exports loaders with format detection.

### Testing Requirements

These files are inputs; they have no tests of their own. They are
exercised by:

- `packages/fit/src/tests/` — FIT reader + writer + round-trip.
- `packages/tcx/src/test-utils/` — TCX round-trip.
- `packages/zwo/src/test-utils/` — ZWO round-trip + XSD validation.
- `packages/garmin/` — GCN reader + writer.
- `packages/cli/src/tests/` — CLI smoke `kaiord convert`.

### Common Patterns

- One fixture covers one structural shape: individual steps, nested repeats,
  custom target values, heart-rate targets, etc.
- GCN fixtures come in `*Input`/`*Output` pairs because Garmin's API
  normalizes the payload on read.

## Dependencies

### Internal

Consumed by every format-adapter package and the CLI smoke tests via
`@kaiord/core/test-utils`.

### External

None — fixtures are static binary/JSON/XML files.

<!-- MANUAL: -->
