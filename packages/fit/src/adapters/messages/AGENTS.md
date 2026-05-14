<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# messages

## Purpose

FIT→KRD message parsing and file-type routing. Detects whether a FIT file is a structured workout, recorded activity, or course; validates message structure; and dispatches to the appropriate domain mapper (activity, workout, or course).

## Key Files

| File                           | Description                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| `messages.mapper.ts`           | Entry point: detects file type from FIT message keys; routes to activity/workout mapper. |
| `activity.mapper.ts`           | Converts activity files (session + record messages) to KRD recorded activity.            |
| `workout.mapper.ts`            | Converts workout files (workout + step messages) to KRD structured workout.              |
| `messages.validator.ts`        | Validates FIT message structure (required fields, shape).                                |
| `activity-validator.ts`        | Activity-specific validation: session and record consistency.                            |
| `activity-messages.creator.ts` | Builds FIT message array from KRD recorded activity.                                     |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **File type detection:** `messages.mapper.ts` examines FIT message keys (`workoutMesgs`, `sessionMesgs`, `recordMesgs`) to classify file.
- **Routing logic:** Structured workout → `mapWorkoutFileToKRD`; recorded activity → `mapActivityFileToKRD`.
- **Message shape:** All FIT messages are plain objects with camelCase fields; types defined in `../shared/types.ts`.
- **Error handling:** Validation errors thrown as `FitParsingError` from `@kaiord/core`.

### Testing Requirements

- Unit tests for file type detection (workout/activity/course).
- Integration tests for activity and workout mapper chains.
- Round-trip tests verify fidelity of parsed messages.

### Common Patterns

- **Mappers chain:** `messages.mapper.ts` → `activity.mapper.ts` → `../session/`, `../record/`, `../lap/`, `../event/`, `../metadata/`.
- **Message validation:** Occurs early; bad structure throws before mapping.

## Dependencies

### Internal

- `@kaiord/core` - KRD, Workout, FileType, Logger, error types.
- `../session/` - Session metadata conversion.
- `../record/` - Record (time-series) conversion.
- `../lap/` - Lap segmentation.
- `../event/` - Event message conversion.
- `../metadata/` - File metadata.
- `../shared/` - Type definitions, message numbers.

### External

- `zod` - Schema validation.

<!-- MANUAL: -->
