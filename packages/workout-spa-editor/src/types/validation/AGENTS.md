<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/types/validation/`

## Purpose

Validation helpers: formatters for Zod errors into UX-friendly shapes, helper utilities for partial form validation, and the canonical `ValidationError[]` carrier type.

## Key Files

- `validators.ts` — `validateWorkout`, `validateWorkoutStep`, `validateRepetitionBlock`, `validatePartialWorkoutStep`, `validatePartialRepetitionBlock`, `validateWorkoutMetadata`.
- `validate-helper.ts` — shared `safeParse → { success | errors }` adapter.
- `validation-types.ts` — `ValidationError`, `ValidationResult` types.
- `formatters.ts` / `.test.ts` — `formatZodError`, `formatValidationErrors`, `getFieldError`, `hasFieldError`, `getNestedErrors`, `mergeValidationErrors`.
- `helpers.ts` / `.test.ts` (+ `.test-fixtures.ts`) — `createDebouncedValidator`, `validateField`.

## For AI Agents

### Working In This Directory

1. **Stay pure.** No DOM, no React; this directory is consumed by `application/` and `components/` alike.
2. **Errors carry a `path`** so consumers can drive per-field error display.

### Testing Requirements

- Formatters and helpers each have `.test.ts` covering happy + error paths.

## Dependencies

### Internal

- `../schemas/*`.

### External

- `zod`.

<!-- MANUAL: -->
