<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 -->

# test-utils

## Purpose

Test fixture constants for TCX package tests. Numeric values used across unit and integration tests (time durations, distances, heart rates, power, indices). Pure module: zero imports, only constant exports.

## Key Files

| File           | Description                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constants.ts` | Numeric test fixtures. Time durations (seconds), distances (meters), heart rate zones, power values, step counts, indices. All `as const` for type safety. |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

**Purpose:**

- Centralize numeric fixtures used across test files.
- Enable DRY test code (reuse same constant in multiple test suites).
- Document semantics of numbers used in tests (e.g., `TIME_SECONDS_300` = 5 minutes).

**Constant Naming:**

- Format: `{SEMANTIC}_{UNIT}_{VALUE}`.
- Examples:
  - `TIME_SECONDS_300` = 300 seconds (5 minutes).
  - `DISTANCE_METERS_5000` = 5000 meters (5 km).
  - `HEART_RATE_ZONE_THREE` = zone 3 (applies to HR zone mapping).
  - `POWER_WATTS_250` = 250 watts.
  - `STEP_INDEX_FOUR` = step index 4 (0-based or 1-based, clarify in comment).

**Usage Pattern:**

```typescript
import { TIME_SECONDS_300, DISTANCE_METERS_5000 } from "@kaiord/tcx/test-utils";

it("should convert 5-minute time duration", () => {
  // Arrange
  const tcxDuration = { TimeInSeconds: TIME_SECONDS_300 };

  // Act
  const krdDuration = convertTcxDuration(tcxDuration);

  // Assert
  expect(krdDuration.duration).toBe(TIME_SECONDS_300);
});
```

**Module Strategy:**

- Pure module: no imports except constants.
- Safe to import anywhere without risk of circular dependencies.
- TypeScript `as const` ensures types are inferred (e.g., `300` not `number`).

### Testing Requirements

**No Tests for test-utils Itself:**

- Test-utils is a pure fixture module.
- Tests depend on these constants; correctness validated indirectly by test passing.
- Manual review: verify constant names match their values (e.g., `TIME_SECONDS_300 = 300`).

### Common Patterns

**Organizing Constants:**

- Group by semantic meaning (time, distance, heart rate, etc.).
- Use comment sections to delineate groups.
- Avoid numeric literals in test files; always use constants.

**Type Safety with `as const`:**

```typescript
export const TIME_SECONDS_300 = 300 as const; // type: 300 (literal), not number
export const HEART_RATE_ZONE_THREE = 3 as const;
```

**Adding New Constants:**

- New constant? Add it here, not inline in test.
- Reuse existing constant if semantically correct (don't create duplicates).

## Dependencies

### Internal

None.

### External

None.
