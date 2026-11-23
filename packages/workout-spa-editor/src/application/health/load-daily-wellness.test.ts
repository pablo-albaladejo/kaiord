import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { HealthDailyRecord } from "../../types/health/health-records";
import { AUTHORITY_MATRIX_ID } from "../data-source-policy/automatic-authority";
import { loadDailyWellness } from "./load-daily-wellness";

const PROFILE_ID = "22222222-2222-4222-8222-222222222222";
const DAY = "2026-11-20";
const GARMIN_STEPS = 4000;
const WHOOP_STEPS = 5000;

const row = (sourceBridgeId: string, steps: number): HealthDailyRecord => ({
  id: `${sourceBridgeId}-${DAY}`,
  profileId: PROFILE_ID,
  date: DAY,
  sourceBridgeId,
  krd: {
    kind: "daily",
    version: "2.0",
    date: DAY,
    steps,
    activeCalories: 500,
    restingCalories: 1700,
    intensityMinutes: { moderate: 0, vigorous: 0 },
  },
});

const seed = async (matrix?: boolean) => {
  const persistence = createInMemoryPersistence();
  await persistence.healthDaily.put(row("garmin-bridge", GARMIN_STEPS));
  await persistence.healthDaily.put(row("whoop-bridge", WHOOP_STEPS));
  await persistence.dataTypeSourcePolicy.put({
    profileId: PROFILE_ID,
    dataType: "daily-wellness",
    mode: "priority",
    sourceOrder: ["garmin-bridge"],
  });
  if (matrix !== undefined) {
    await persistence.capabilityDecisions.put({
      profileId: PROFILE_ID,
      capabilityId: AUTHORITY_MATRIX_ID,
      on: matrix,
      updatedAt: "2026-11-01T00:00:00.000Z",
    });
  }
  return persistence;
};

const stepsRead = async (matrix?: boolean) => {
  const persistence = await seed(matrix);
  const [reading] = await loadDailyWellness(persistence, PROFILE_ID, {
    start: DAY,
    end: DAY,
  });
  return reading?.krd.steps;
};

describe("loadDailyWellness and the Authority", () => {
  it("should read the matrix choice while the athlete has one", async () => {
    // Arrange
    const matrix = undefined;

    // Act
    const steps = await stepsRead(matrix);

    // Assert
    expect(steps).toBe(GARMIN_STEPS);
  });

  it("should read the automatic Authority once the matrix is off", async () => {
    // Arrange
    const matrix = false;

    // Act
    const steps = await stepsRead(matrix);

    // Assert
    expect(steps).toBe(WHOOP_STEPS);
  });
});
