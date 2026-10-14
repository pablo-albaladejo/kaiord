import { describe, expect, it } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { HealthDailyRecord } from "../../types/health/health-records";
import { saveManualHealthMetric } from "../health/save-manual-health-metric.use-case";
import { loadDayEnergySources } from "./load-day-energy-sources";

const PROFILE_ID = "p1";
const DATE = "2026-06-21";
const IMPORTED_ACTIVE_KCAL = 650;
const IMPORTED_RESTING_KCAL = 1750;
const IMPORTED_STEPS = 4000;
const MANUAL_STEPS = 12000;

const daily = (
  id: string,
  sourceBridgeId: string,
  steps: number,
  kcal: { active: number; resting: number }
): HealthDailyRecord => ({
  id,
  profileId: PROFILE_ID,
  date: DATE,
  sourceBridgeId,
  krd: {
    kind: "daily",
    version: "2.0",
    date: DATE,
    steps,
    activeCalories: kcal.active,
    restingCalories: kcal.resting,
    intensityMinutes: { moderate: 0, vigorous: 0 },
  },
});

const imported = daily("imported", "garmin-bridge", IMPORTED_STEPS, {
  active: IMPORTED_ACTIVE_KCAL,
  resting: IMPORTED_RESTING_KCAL,
});
const manual = daily("manual-row", "manual", MANUAL_STEPS, {
  active: 0,
  resting: 0,
});

const wellnessAfterWriting = async (rows: HealthDailyRecord[]) => {
  const persistence: PersistencePort = createInMemoryPersistence();
  for (const row of rows) await persistence.healthDaily.put(row);
  const sources = await loadDayEnergySources(persistence, PROFILE_ID, DATE);
  return sources.wellness?.krd;
};

describe("loadDayEnergySources daily wellness", () => {
  it("should read the imported calories and the manual steps after a manual steps entry", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthDaily.put(imported);
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "daily-wellness", day: DATE, value: MANUAL_STEPS }
    );

    // Act
    const sources = await loadDayEnergySources(persistence, PROFILE_ID, DATE);

    // Assert
    expect(sources.wellness?.krd.activeCalories).toBe(IMPORTED_ACTIVE_KCAL);
    expect(sources.wellness?.krd.restingCalories).toBe(IMPORTED_RESTING_KCAL);
    expect(sources.wellness?.krd.steps).toBe(MANUAL_STEPS);
  });

  it("should read the same day whatever order the rows were written in", async () => {
    // Arrange
    const orders = [
      [imported, manual],
      [manual, imported],
    ];

    // Act
    const readings = await Promise.all(orders.map(wellnessAfterWriting));

    // Assert
    expect(readings[0]).toEqual(readings[1]);
    expect(readings[0]?.activeCalories).toBe(IMPORTED_ACTIVE_KCAL);
  });

  it("should rank the day's rows by the data type's priority sourceOrder", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthDaily.put(imported);
    await persistence.healthDaily.put(manual);
    await persistence.integrationPolicy.put({
      id: "00000000-0000-4000-8000-000000000001",
      profileId: PROFILE_ID,
      dataType: "daily-wellness",
      bridgeId: "garmin-bridge",
      direction: "import",
      mode: "auto",
      enabled: true,
      updatedAt: "2026-06-01T00:00:00.000Z",
    });
    await persistence.dataTypeSourcePolicy.put({
      profileId: PROFILE_ID,
      dataType: "daily-wellness",
      mode: "priority",
      sourceOrder: ["garmin-bridge", "manual"],
    });

    // Act
    const sources = await loadDayEnergySources(persistence, PROFILE_ID, DATE);

    // Assert
    expect(sources.wellness?.krd.steps).toBe(IMPORTED_STEPS);
  });
});
