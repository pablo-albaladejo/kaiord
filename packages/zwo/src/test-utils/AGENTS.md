<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/test-utils/

## Purpose

Test fixtures, constants, and utilities exported for use by other packages and tests. Provides reusable test data (sample workouts, metadata, fixtures) and helpers for ZWO testing.

## Key Files

| File           | Description                                                       |
| -------------- | ----------------------------------------------------------------- |
| `index.ts`     | Re-exports all test utilities (delegates to constants)            |
| `constants.ts` | Test constants: sample workouts, fixture data, metadata templates |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Export pattern**: `index.ts` re-exports all utilities from `constants.ts` for simplified imports by downstream packages.
- **Scope**: Test utilities are exported in `package.json` `files` array and accessible via import path `@kaiord/zwo/test-utils`.
- **Content**: Sample ZWO files, KRD fixtures, metadata templates, common test data.

### Testing Requirements

No tests for test-utils (they are helper definitions).

### Common Patterns

- **Import usage**:

  ```typescript
  import { sampleZwoWorkout, sampleKrdMetadata } from "@kaiord/zwo/test-utils";
  ```

- **Fixture naming**: Descriptive names (e.g., `sampleSteadyStateWorkout`, `simplePowerTarget`) aid discoverability.

## Dependencies

### Internal

- `@kaiord/core` (KRD, Metadata, WorkoutStep types)

### External

None directly.

<!-- MANUAL: -->
