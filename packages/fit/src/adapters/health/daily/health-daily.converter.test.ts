import { describe, expect, it } from "vitest";

import {
  mapFitMonitoringToKrdDaily,
  mapKrdDailyToFit,
} from "./health-daily.converter";

const DAY_TIMESTAMP = "2024-12-31T23:11:00.000Z";
const EXPECTED_DATE = "2024-12-31";
const STEPS_RUN = 31;
const STEPS_WALK = 3142;
const TOTAL_STEPS = STEPS_RUN + STEPS_WALK;
const ACTIVE_KCAL_RUN = 1;
const ACTIVE_KCAL_WALK = 68;
const TOTAL_ACTIVE_KCAL = ACTIVE_KCAL_RUN + ACTIVE_KCAL_WALK;
const RESTING_KCAL = 2042;
const FULL_DAY_MIN = 1440;

describe("mapFitMonitoringToKrdDaily", () => {
  it("should sum steps and active calories across all monitoring messages", () => {
    // Arrange
    const info = {
      timestamp: new Date(DAY_TIMESTAMP),
      restingMetabolicRate: RESTING_KCAL,
    };
    const monitoring = [
      { steps: STEPS_WALK, activeCalories: ACTIVE_KCAL_WALK },
      { steps: STEPS_RUN, activeCalories: ACTIVE_KCAL_RUN },
    ];

    // Act
    const daily = mapFitMonitoringToKrdDaily(info, monitoring);

    // Assert
    expect(daily?.steps).toBe(TOTAL_STEPS);
    expect(daily?.activeCalories).toBe(TOTAL_ACTIVE_KCAL);
    expect(daily?.restingCalories).toBe(RESTING_KCAL);
    expect(daily?.date).toBe(EXPECTED_DATE);
    expect(daily?.intensityMinutes).toEqual({ moderate: 0, vigorous: 0 });
  });

  it("should derive the date from the first monitoring message when no info is present", () => {
    // Arrange
    const monitoring = [{ timestamp: new Date(DAY_TIMESTAMP) }];

    // Act
    const daily = mapFitMonitoringToKrdDaily(undefined, monitoring);

    // Assert
    expect(daily?.date).toBe(EXPECTED_DATE);
    expect(daily?.steps).toBe(0);
  });

  it("should return undefined when no date can be derived", () => {
    // Arrange
    const monitoring: ReturnType<typeof Object>[] = [];

    // Act
    const daily = mapFitMonitoringToKrdDaily(undefined, monitoring);

    // Assert
    expect(daily).toBeUndefined();
  });
});

describe("mapKrdDailyToFit", () => {
  it("should emit a header info + a single day-summary monitoring with durationMin 1440", () => {
    // Arrange
    const daily = {
      kind: "daily" as const,
      version: "2.0",
      date: EXPECTED_DATE,
      steps: TOTAL_STEPS,
      activeCalories: TOTAL_ACTIVE_KCAL,
      restingCalories: RESTING_KCAL,
      intensityMinutes: { moderate: 0, vigorous: 0 },
    };

    // Act
    const { info, summary } = mapKrdDailyToFit(daily);

    // Assert
    expect(info.restingMetabolicRate).toBe(RESTING_KCAL);
    expect(summary.steps).toBe(TOTAL_STEPS);
    expect(summary.activeCalories).toBe(TOTAL_ACTIVE_KCAL);
    expect(summary.durationMin).toBe(FULL_DAY_MIN);
  });
});
