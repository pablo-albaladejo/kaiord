<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# converters

## Purpose

Pure domain-layer converters that operate on already-validated domain values. NOT format adapters (those live in sibling packages like `@kaiord/fit`). Includes a unit converter for length and a high-level `createWorkoutKRD` boundary that validates an unknown `Workout` payload and wraps it in a fresh KRD envelope.

## Key Files

| File                               | Description                                                                                                                                                                                                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `length-unit.converter.ts`         | `convertLengthToMeters(length, unit)` — multiplies by 0.9144 when unit is `"yards"`, otherwise returns input unchanged. Single conversion function used by swim adapters.                                                                                                                                         |
| `length-unit.converter.test.ts`    | Tests for the yards→meters path and the meters identity.                                                                                                                                                                                                                                                          |
| `workout-to-krd.converter.ts`      | `createWorkoutKRD(workout, options?)` — validates unknown input against `workoutSchema`, throws `KrdValidationError` on failure, otherwise emits a `{version:"1.0", type:"structured_workout", metadata, extensions.structured_workout}` envelope. The `options.created` override exists for deterministic tests. |
| `workout-to-krd.converter.test.ts` | Tests for happy-path wrapping, validation failure, optional `subSport` propagation, and `created` override.                                                                                                                                                                                                       |

## For AI Agents

### Working In This Directory

- Naming rule: `*.converter.ts` files have **logic and tests**; `*.mapper.ts` files are simple transforms with no logic and no tests (see CLAUDE.md). `length-unit.converter.ts` is borderline but stays `converter` because it's an active conversion with a unit branch.
- `createWorkoutKRD` is the canonical validation boundary for agent/LLM-provided workout payloads. It MUST `safeParse` first and use `mapZodErrors` so the thrown `KrdValidationError` carries a `{field, message}[]` list.
- `options.created` defaults to `new Date().toISOString()`. Tests inject a fixed timestamp for snapshot stability — preserve that injection point if you refactor.

### Testing Requirements

- Coverage target: 80%. Direct vitest coverage on every public function. AAA + `should ` invariants apply.

### Common Patterns

- **Validate → throw or wrap.** Public functions that accept `unknown` always run a `safeParse` and use `createKrdValidationError` for the failure path.
- **Spread-then-override.** `{ ...(parsed.subSport && { subSport: parsed.subSport }) }` — conditional property inclusion via short-circuit spread.

## Dependencies

### Internal

- `../schemas/workout` — `workoutSchema` for validation.
- `../schemas/krd` — `KRD` return type.
- `../schemas/length-unit` — `LengthUnit` for the converter param.
- `../types/errors` — `createKrdValidationError`.
- `../validation/map-zod-errors` — `mapZodErrors`.

### External

None (uses `Date` only).

<!-- MANUAL: -->
