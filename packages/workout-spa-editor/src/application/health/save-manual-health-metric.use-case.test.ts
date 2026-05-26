import {
  type DailyWellness,
  dailyWellnessSchema,
  sleepRecordSchema,
} from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { saveManualHealthMetric } from "./save-manual-health-metric.use-case";

const PROFILE_ID = "p-1";
const DAY = "2026-05-23";
const SAMPLE_WEIGHT_KG = 75;
const SAMPLE_WEIGHT_KG_2 = 80;
const SAMPLE_SLEEP_SCORE = 88;
const SAMPLE_RMSSD = 45;
const PRIOR_STEPS = 1000;
const NEW_STEPS = 8000;
const PRIOR_ACTIVE_KCAL = 300;
const PRIOR_REST_KCAL = 1700;
const PRIOR_MODERATE_MIN = 20;
const PRIOR_VIGOROUS_MIN = 5;

let counter = 0;
const sequentialNewId = (): string => `id-${(counter += 1)}`;

const priorDaily = (): DailyWellness => ({
  kind: "daily",
  version: "2.0",
  date: DAY,
  steps: PRIOR_STEPS,
  activeCalories: PRIOR_ACTIVE_KCAL,
  restingCalories: PRIOR_REST_KCAL,
  intensityMinutes: {
    moderate: PRIOR_MODERATE_MIN,
    vigorous: PRIOR_VIGOROUS_MIN,
  },
});

describe("saveManualHealthMetric", () => {
  it("should write a new weight record for a day with no prior weight", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "weight", day: DAY, value: SAMPLE_WEIGHT_KG }
    );

    // Assert
    const rows = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.krd.weightKilograms).toBe(SAMPLE_WEIGHT_KG);
    expect(result?.recordId).toBe(rows[0]?.id);
  });

  it("should reuse the existing record id when a weight already exists for that day", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const deps = { persistence, profileId: PROFILE_ID, newId: sequentialNewId };

    // Act
    const first = await saveManualHealthMetric(deps, {
      metric: "weight",
      day: DAY,
      value: SAMPLE_WEIGHT_KG,
    });
    const second = await saveManualHealthMetric(deps, {
      metric: "weight",
      day: DAY,
      value: SAMPLE_WEIGHT_KG_2,
    });

    // Assert
    const rows = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(1);
    expect(second?.recordId).toBe(first?.recordId);
    expect(rows[0]?.krd.weightKilograms).toBe(SAMPLE_WEIGHT_KG_2);
  });

  it("should insert two rows when the unlocked use case is called concurrently", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const deps = { persistence, profileId: PROFILE_ID, newId: sequentialNewId };

    // Act
    await Promise.all([
      saveManualHealthMetric(deps, {
        metric: "weight",
        day: DAY,
        value: SAMPLE_WEIGHT_KG,
      }),
      saveManualHealthMetric(deps, {
        metric: "weight",
        day: DAY,
        value: SAMPLE_WEIGHT_KG_2,
      }),
    ]);

    // Assert
    const rows = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(2);
  });

  it("should overwrite an imported value with a manual value for the same date and metric", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthWeight.put({
      id: "imported-1",
      profileId: PROFILE_ID,
      date: DAY,
      krd: {
        kind: "weight",
        version: "2.0",
        measuredAt: `${DAY}T08:00:00.000Z`,
        weightKilograms: SAMPLE_WEIGHT_KG,
      },
    });

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "weight", day: DAY, value: SAMPLE_WEIGHT_KG_2 }
    );

    // Assert
    const rows = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("imported-1");
    expect(rows[0]?.krd.weightKilograms).toBe(SAMPLE_WEIGHT_KG_2);
  });

  it("should preserve prior calories and intensity when overwriting steps", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthDaily.put({
      id: "imported-daily",
      profileId: PROFILE_ID,
      date: DAY,
      krd: priorDaily(),
    });

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "daily-wellness", day: DAY, value: NEW_STEPS }
    );

    // Assert
    const rows = await persistence.healthDaily.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows[0]?.krd.steps).toBe(NEW_STEPS);
    expect(rows[0]?.krd.activeCalories).toBe(PRIOR_ACTIVE_KCAL);
    expect(rows[0]?.krd.intensityMinutes.moderate).toBe(PRIOR_MODERATE_MIN);
  });

  it("should zero-fill calories and intensity when saving steps for a day with no prior daily row", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "daily-wellness", day: DAY, value: NEW_STEPS }
    );

    // Assert
    const rows = await persistence.healthDaily.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows[0]?.krd.steps).toBe(NEW_STEPS);
    expect(rows[0]?.krd.activeCalories).toBe(0);
    expect(rows[0]?.krd.intensityMinutes).toEqual({ moderate: 0, vigorous: 0 });
  });

  it("should build a minimal valid sleep payload that passes sleepRecordSchema.parse", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "sleep", day: DAY, value: SAMPLE_SLEEP_SCORE }
    );

    // Assert
    const rows = await persistence.healthSleep.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(() => sleepRecordSchema.parse(rows[0]?.krd)).not.toThrow();
    expect(rows[0]?.krd.score).toBe(SAMPLE_SLEEP_SCORE);
  });

  it("should build a minimal valid daily payload that passes dailyWellnessSchema.parse", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "daily-wellness", day: DAY, value: NEW_STEPS }
    );

    // Assert
    const rows = await persistence.healthDaily.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(() => dailyWellnessSchema.parse(rows[0]?.krd)).not.toThrow();
  });

  it("should set hrv measurementWindow to a valid enum value", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "hrv", day: DAY, value: SAMPLE_RMSSD }
    );

    // Assert
    const rows = await persistence.healthHrv.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows[0]?.krd.measurementWindow).toBe("spot");
  });

  it("should not write when the value is non-finite", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "weight", day: DAY, value: Number.NaN }
    );

    // Assert
    expect(result).toBeUndefined();
    const rows = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(0);
  });

  it("should not persist an out-of-range sleep score", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "sleep", day: DAY, value: 150 }
    );

    // Assert
    expect(result).toBeUndefined();
    const rows = await persistence.healthSleep.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(0);
  });

  it("should not persist a fractional sleep score", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "sleep", day: DAY, value: 88.5 }
    );

    // Assert
    expect(result).toBeUndefined();
    const rows = await persistence.healthSleep.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(0);
  });
});
