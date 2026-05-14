<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/application/library/`

## Purpose

Workout-template CRUD + scheduling. Operates on the Library table via `TemplateRepository`.

## Key Files

- `add-template.ts` / `.test.ts` — create a template from a workout (`stripIds` runs on the way in).
- `update-template.ts` / `.test.ts` — patch fields on an existing template.
- `delete-template.ts` / `.test.ts` — remove by id.
- `schedule-template.ts` / `.test.ts` — clone a template into a dated `WorkoutRecord` (the "schedule from library" flow used by `EmptyDayDialog`).
- `errors.ts` — `*Error` domain types.
- `test-fixtures.ts` — canonical template inputs.

## Subdirectories

- `helpers/` — `template-factory.ts` for building canonical template shapes.

## For AI Agents

### Working In This Directory

1. **`stripIds` runs on every write.** Templates store the canonical KRD shape with no UI ids.
2. **Scheduling creates a new workout row.** The template is not mutated; the schedule action returns a fresh `WorkoutRecord` id.

### Testing Requirements

- Use `createInMemoryTemplateRepository` + `createInMemoryWorkoutRepository` from `../../test-utils/`.

### Common Patterns

- Factory exports: `createAddTemplate({ templates })`, etc.

## Dependencies

### Internal

- `../../ports/persistence-port` (`TemplateRepository`, `WorkoutRepository`).
- `../../types/workout-library`, `../../types/calendar-schemas`.
- `../../store/strip-ids` (on the way in).

### External

- `zod`.

<!-- MANUAL: -->

The Library is dual-mounted via the LibraryPage + the TemplatePickerDialog. Only those two call sites are allowed (R-LibraryNoDualMount).
