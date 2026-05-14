<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# types

## Purpose

The full error-class taxonomy plus the `ValidationError` / `ToleranceViolation` payload types they carry. Every error gets both a `class FooError extends Error` (so callers can use `instanceof`) and a `createFooError(...)` factory (so callers can use FP style). The `errors.ts` barrel is the public re-export.

## Key Files

| File                  | Description                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `errors.ts`           | Barrel — re-exports every error class+factory plus `ValidationError`/`ToleranceViolation` types.                                                                    |
| `error-types.ts`      | `ValidationError = {field, message, expected?, actual?}` and `ToleranceViolation = {field, expected, actual, deviation, tolerance}`. Pure types — no runtime.       |
| `fit-errors.ts`       | `FitParsingError` + `createFitParsingError(message, cause?)`. Thrown by `@kaiord/fit` readers on corrupt FIT data.                                                  |
| `tcx-errors.ts`       | `TcxParsingError` and `TcxValidationError` (carries `ValidationError[]`) + their factories. Thrown by `@kaiord/tcx`.                                                |
| `zwift-errors.ts`     | `ZwiftParsingError` and `ZwiftValidationError` (carries `ValidationError[]`) + their factories. Thrown by `@kaiord/zwo`.                                            |
| `garmin-errors.ts`    | `GarminParsingError` + factory. Thrown by `@kaiord/garmin` (GCN) and `@kaiord/garmin-connect` JSON parsing.                                                         |
| `service-errors.ts`   | `ServiceAuthError` (auth failure) and `ServiceApiError` (with optional `statusCode`) + factories. Thrown by remote `WorkoutService` impls.                          |
| `krd-errors.ts`       | `KrdValidationError` + factory — the universal validation failure type. Carries `ValidationError[]`. Thrown by `validateKrd`, `extractWorkout`, `createWorkoutKRD`. |
| `tolerance-errors.ts` | `ToleranceExceededError` + factory — carries `ToleranceViolation[]`. Thrown when round-trip tolerances fail.                                                        |

## For AI Agents

### Working In This Directory

- EVERY error MUST be exported as BOTH a class (for `instanceof`) AND a factory (`createXxxError`). Tests assert both shapes — see `errors.test.ts`.
- Every error class sets `public override readonly name = "..."` so stack-trace serialization and structured logging see a stable type tag.
- Every error class calls `Error.captureStackTrace(this, FooError)` inside a guarded `if` (V8-only). Don't remove that — it makes stack traces start at the throw site, not inside the constructor.
- `cause` is `unknown`, not `Error`. Some FIT/TCX libs throw plain strings; preserving `unknown` lets callers branch on `typeof` themselves.
- When adding a new error: (1) define `class FooError extends Error` with `name` + `Error.captureStackTrace`; (2) export `createFooError(message, ...)` as a thin `new FooError(...)` wrapper; (3) re-export both from `errors.ts`.

### Testing Requirements

- Coverage target: 80%. `errors.test.ts` is the centralised suite — every class+factory pair is tested for `instanceof`, `name`, `message`, and constructor-injected fields (errors[], violations[], cause, statusCode). AAA + `should ` invariants apply.

### Common Patterns

- **Class + factory dual export** for every error.
- **`override readonly name` literal tag** for stable runtime type identification.
- **Optional `cause: unknown`** for wrapping foreign errors.

## Dependencies

### Internal

- `./error-types` — `ValidationError`, `ToleranceViolation` payload types.

### External

None.

<!-- MANUAL: -->
