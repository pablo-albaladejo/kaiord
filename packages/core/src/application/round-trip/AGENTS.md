<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# round-trip

## Purpose

The round-trip validation use case (`validateRoundTrip`) and the structural KRD comparers it delegates to. This is a true `application/` use case: `validate-round-trip.ts` is part of the PUBLIC API — re-exported from `src/index.ts`, consumed at runtime by `@kaiord/cli` (`kaiord validate`) and `@kaiord/mcp`, and used by adapter integration tests to verify that FIT↔KRD↔FIT and KRD↔FIT↔KRD round-trips stay within tolerance.

## Key Files

| File                       | Description                                                                                                                                                                                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `validate-round-trip.ts`   | `validateRoundTrip(binaryReader, binaryWriter, toleranceChecker, logger)` factory returning `{ validateFitToKrdToFit, validateKrdToFitToKrd }`. Each method runs a two-step round-trip, calls `compareKRDs`, logs a summary, and returns the `ToleranceViolation[]`. Also exports `ValidateRoundTrip` type via `ReturnType<typeof validateRoundTrip>`. |
| `compare-krds.ts`          | `compareKRDs(krd1, krd2, toleranceChecker, logger)` — top-level entry (public API): dispatches to `compareSessions`, `compareLaps`, `compareRecords`, `compareWorkoutSteps` and concatenates their violations.                                                                                                                                         |
| `compare-workout-steps.ts` | Walks `extensions.structured_workout.steps`: exact step count, node kind (step vs repetition), exact `repeatCount`, recursion into blocks, then per step `compareStepDuration`, `compareStepTarget` and the intensity.                                                                                                                                 |
| `compare-step-duration.ts` | Duration type (categorical), then seconds (`checkTime`), meters (`checkDistance`), bpm (`checkHeartRate`), watts (`checkPower`); calories and `repeatFrom` exact.                                                                                                                                                                                      |
| `compare-step-target.ts`   | Target type and unit (categorical), then value/min/max: zones and swim strokes exact, `percent_ftp` via `checkPercentFtp` (falls back to `checkPower`), otherwise the check of the target type.                                                                                                                                                        |
| `step-violations.ts`       | `exactCheck` (tolerance 0), `pushNumeric`, and `pushCategorical`, which pushes the sentinel `expected 0, actual 1, deviation 1, tolerance 0` with the real values in `expectedValue`/`actualValue`.                                                                                                                                                    |
| `compare-sessions.ts`      | Iterates `min(krd1.sessions.length, krd2.sessions.length)` and checks `totalElapsedTime`, `totalDistance`, `avgHeartRate`, `maxHeartRate`, `avgCadence`, `avgPower` per session.                                                                                                                                                                       |
| `compare-laps.ts`          | Same shape as sessions: checks lap-level `totalElapsedTime`, `totalDistance`, avg/max HR, avgCadence, avgPower.                                                                                                                                                                                                                                        |
| `compare-records.ts`       | Per-record (time-series) checks: `heartRate`, `cadence`, `power`, `speed` (via `checkPace`), `distance`.                                                                                                                                                                                                                                               |
| `check-field.ts`           | `checkField(violations, checkFn, value1, value2, fieldName)` — utility that skips when either value is `undefined`, otherwise calls the checker and pushes the violation with an overridden `field` label.                                                                                                                                             |

## For AI Agents

### Working In This Directory

- `validate-round-trip.ts` IS public API — its `ValidateRoundTrip` type and `validateRoundTrip` factory are re-exported from `src/index.ts`. Breaking the signature requires a major version bump.
- The comparers are tolerant by design: missing optional fields on either side are SKIPPED (via `checkField`'s undefined-guard), not flagged. Round-trip validation is about "did the value drift?" — a value that wasn't there originally and isn't there after has not drifted.
- `min(krd1.X.length, krd2.X.length)` iteration deliberately ignores trailing items of sessions, laps and records. Workout steps are the exception: a dropped or added step is a lossy conversion, so `compareWorkoutSteps` reports the length mismatch exactly and then compares the shared prefix.
- Categorical step mismatches (duration/target type, unit, intensity, node kind) are violations with `tolerance: 0` and string `expectedValue`/`actualValue`; formatters print those values, not the numeric sentinel. Never loosen a step check to make a format pass — fix the adapter or report the gap.
- This folder is `application/` layer code: no external libraries, no `node:` builtins, no `adapters/` imports (enforced by `R-ArchAppPure`/`R-ArchLeftward`). Comparers MUST return violation arrays rather than asserting with a test framework.
- `validateFitToKrdToFit` does FIT → KRD → FIT → KRD and compares the two KRDs (NOT the two FIT buffers). `validateKrdToFitToKrd` does KRD → FIT → KRD → FIT → KRD and compares the two KRDs. Both end in KRD comparison because comparing binary FIT buffers is fragile (timestamps, padding).

### Testing Requirements

- Coverage target: 80%. `validate-round-trip.test.ts` is a 20k-line vitest suite (heavy mocking). AAA + `should ` invariants apply.

### Common Patterns

- **Undefined-guard utility** (`checkField`) — every per-field check goes through it so the undefined case is centralised.
- **Comparison via `min(len1, len2)`** — tolerate length mismatches for sessions, laps and records (not for workout steps).
- **Two-step round-trip → compare KRDs, not buffers** — avoid spurious diffs from format-level noise.

## Dependencies

### Internal

- `../../domain/schemas/krd` — `KRD` type.
- `../../domain/validation/tolerance-checker` — `ToleranceChecker`, `ToleranceViolation`.
- `../../ports/format-strategy` — `BinaryReader`, `BinaryWriter`.
- `../../ports/logger` — `Logger`.

### External

None (application-layer purity, enforced by `R-ArchAppPure`).

<!-- MANUAL: -->
