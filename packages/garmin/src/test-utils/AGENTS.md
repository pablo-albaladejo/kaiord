<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/test-utils

## Purpose

Shared test fixtures and constants for @kaiord/garmin test files. Provides reusable test data, GCN/KRD fixtures, and helper functions for conversion tests.

## Key Files

| File           | Description                                                              |
| -------------- | ------------------------------------------------------------------------ |
| `constants.ts` | Fixture constants: sample GCN payloads, KRD samples, target definitions. |

## For AI Agents

### Working In This Directory

**Test Utils Philosophy:**

- Reusable constants: sample workouts, steps, targets shared across test files.
- No business logic here; only test data and helpers.
- Keep fixtures realistic but minimal (avoid huge payloads).

**Example Constants:**

```typescript
// Sample GCN sport types
export const GARMIN_SPORT_RUNNING = { sportTypeId: 1, sportTypeKey: "running" };
export const GARMIN_SPORT_CYCLING = { sportTypeId: 2, sportTypeKey: "cycling" };

// Sample KRD sport types
export const KRD_SPORT_RUNNING = "running";
export const KRD_SPORT_CYCLING = "cycling";

// Sample target definitions
export const POWER_ZONE_TARGET = {
  trainingPowerZone: {
    trainingPowerZoneHigh: 250,
    trainingPowerZoneLow: 200,
  },
};
```

### Usage in Tests

**Import from test-utils:**

```typescript
import {
  GARMIN_SPORT_RUNNING,
  POWER_ZONE_TARGET,
} from "../test-utils/constants";

it("should map running sport to Garmin", () => {
  // Arrange
  const krd = { sport: KRD_SPORT_RUNNING, steps: [] };

  // Act
  const gcn = convertKrdToGarmin(krd);

  // Assert
  expect(gcn.sportType).toEqual(GARMIN_SPORT_RUNNING);
});
```

### Testing Requirements

**No dedicated tests for test-utils.** Constants and helpers are validated implicitly via tests that use them.

## Dependencies

### Internal

- None (test data only).

### External

- None (constants are plain objects).

<!-- MANUAL: -->
