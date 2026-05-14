<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/types/schemas/`

## Purpose

Zod schemas split into focused files so each file stays under the size cap.

## Key Files

- `core-exports.ts` — re-export of `@kaiord/core` schemas, scoped for the SPA's use.
- `form-schemas.ts` — form-specific schemas (`workoutMetadataFormSchema`, `partialWorkoutStepSchema`, etc.).
- `ui-schemas.ts` — UI-augmented schemas (KRD + `id` field).
- `repetition-block-id.test.ts` — pins the `RepetitionBlockId` brand semantics.

## For AI Agents

### Working In This Directory

1. **No runtime side effects.** Schema files export only schemas + inferred types.
2. **Use `safeParse`,** not `parse`, in consumer code.

## Dependencies

### Internal

- `@kaiord/core` schemas.

### External

- `zod`.

<!-- MANUAL: -->
