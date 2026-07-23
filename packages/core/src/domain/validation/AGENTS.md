<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# validation

## Purpose

Validation primitives the rest of the codebase composes on top of: a strict `validateKrd(unknown): KRD` throwing function, a non-throwing `createSchemaValidator()` port impl returning a `ValidationError[]`, a `createToleranceChecker()` factory producing per-field threshold checkers used by round-trip tests, an `extractWorkout(krd)` helper, and a `mapZodErrors` shim that flattens `ZodIssue[]` into the domain error shape.

## Key Files

| File                   | Description                                                                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `validate-krd.ts`      | `validateKrd(unknown): KRD` — Zod-safe-parses against `krdSchema`; on failure throws `KrdValidationError` with mapped `{field, message}[]`.                                                                                                      |
| `extract-workout.ts`   | `extractWorkout(krd)` — refuses unless `krd.type === "structured_workout"`, then validates `krd.extensions.structured_workout` against `workoutSchema`. Throws `KrdValidationError` with field-level errors.                                     |
| `schema-validator.ts`  | `createSchemaValidator()` — non-throwing alternative: returns `{ validate: (krd: unknown) => ValidationError[] }` (empty array on success). Used where you want to collect ALL errors before deciding what to do.                                |
| `tolerance-checker.ts` | `createToleranceChecker(config?)` factory producing `checkTime/Distance/Power/HeartRate/Cadence/Pace` methods. `DEFAULT_TOLERANCES` matches CLAUDE.md (1s/1W/1bpm/1rpm/0.01 mps). Includes `toleranceConfigSchema` + `toleranceViolationSchema`. |
| `map-zod-errors.ts`    | `mapZodErrors(issues: ZodIssue[]): ValidationError[]` — single source of truth for `ZodIssue → {field, message}` conversion. `field` is `i.path.join(".")` (or `"root"` if the path is empty).                                                   |

## For AI Agents

### Working In This Directory

- Two validators serve different consumers: `validateKrd` THROWS (use at boundaries inside the application layer where a fail-fast is correct); `createSchemaValidator()` RETURNS the list (use when you want to render every error to the user without bailing). Don't merge them.
- The tolerance checker is a stateless object of pure functions; each `check*` returns `ToleranceViolation | null` rather than throwing, because the round-trip comparer aggregates many violations.
- `DEFAULT_TOLERANCES` MUST stay in sync with the values quoted in CLAUDE.md (time ±1s, power ±1W, HR ±1bpm, cadence ±1rpm, pace ±0.01 mps). If they diverge, update CLAUDE.md too.
- `mapZodErrors` is the ONLY place `i.path.join(".")` should happen. Every other consumer (`validateKrd`, `extractWorkout`, `createWorkoutKRD` in the converters folder) MUST funnel through it for consistent field paths.

### Testing Requirements

- Coverage target: 80%. Direct tests in `schema-validator.test.ts`, `tolerance-checker.test.ts`, `extract-workout.test.ts`. AAA + `should ` invariants apply. The tolerance-checker tests use named constants from `../../test-utils/tolerance-constants.ts` instead of inline numbers.

### Common Patterns

- **Throwing vs collecting** as a deliberate two-validator design.
- **Factory + config** for the tolerance checker so tests and adapters can inject custom thresholds without touching the default object.
- **Single conversion shim** (`mapZodErrors`) — never re-implement `ZodIssue → ValidationError` ad-hoc.

## Dependencies

### Internal

- `../schemas/krd` — `KRD`, `krdSchema`.
- `../schemas/workout` — `Workout`, `workoutSchema`.
- `../types/errors` — `createKrdValidationError`.
- `../types/error-types` — `ValidationError`.

### External

- `zod` (types only: `ZodIssue`).

<!-- MANUAL: -->
