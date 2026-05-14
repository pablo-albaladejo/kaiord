<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/application/library/helpers/`

## Purpose

Helpers extracted from library use cases to satisfy the file-size cap.

## Key Files

- `template-factory.ts` — builds canonical `WorkoutTemplate` shapes from a KRD + metadata.

## For AI Agents

### Working In This Directory

1. Helpers are pure functions, no side effects.
2. Imported only by sibling use cases.

### Testing Requirements

- Helpers are exercised indirectly through their consumers' tests.

## Dependencies

### Internal

- `../../../types/workout-library`.

<!-- MANUAL: -->
