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
const WHOOP_BRIDGE = "whoop-bridge";
const WHOOP_STEPS = 7000;
const WHOOP_ACTIVE_KCAL = 720;

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

const imported = daily("imported", "fit-import", IMPORTED_STEPS, {
  active: IMPORTED_ACTIVE_KCAL,
  resting: IMPORTED_RESTING_KCAL,
});
const manual = daily("manual-row", "manual", MANUAL_STEPS, {
  active: 0,
  resting: 0,
});
const whoopRow = daily("whoop-row", WHOOP_BRIDGE, WHOOP_STEPS, {
  active: WHOOP_ACTIVE_KCAL,
  resting: IMPORTED_RESTING_KCAL,
});

const setPolicies = async (
  persistence: PersistencePort,
  { whoopEnabled }: { whoopEnabled: boolean }
) => {
  await persistence.integrationPolicy.put({
    id: "00000000-0000-4000-8000-000000000001",
    profileId: PROFILE_ID,
    dataType: "daily-wellness",
    bridgeId: WHOOP_BRIDGE,
    direction: "import",
    mode: "auto",
    enabled: whoopEnabled,
    updatedAt: "2026-06-01T00:00:00.000Z",
  });
  await persistence.dataTypeSourcePolicy.put({
    profileId: PROFILE_ID,
    dataType: "daily-wellness",
    mode: "priority",
    sourceOrder: [WHOOP_BRIDGE, "manual"],
  });
};

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

  it("should read the whole record of the first source of a priority sourceOrder", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthDaily.put(imported);
    await persistence.healthDaily.put(whoopRow);
    await persistence.healthDaily.put(manual);
    await setPolicies(persistence, { whoopEnabled: true });

    // Act
    const sources = await loadDayEnergySources(persistence, PROFILE_ID, DATE);

    // Assert
    expect(sources.wellness?.sourceBridgeId).toBe(WHOOP_BRIDGE);
    expect(sources.wellness?.krd.steps).toBe(WHOOP_STEPS);
    expect(sources.wellness?.krd.activeCalories).toBe(WHOOP_ACTIVE_KCAL);
  });

  it("should not read a bridge whose import is disabled under priority", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthDaily.put(imported);
    await persistence.healthDaily.put(whoopRow);
    await setPolicies(persistence, { whoopEnabled: false });

    // Act
    const sources = await loadDayEnergySources(persistence, PROFILE_ID, DATE);

    // Assert
    expect(sources.wellness?.sourceBridgeId).toBe("fit-import");
    expect(sources.wellness?.krd.activeCalories).toBe(IMPORTED_ACTIVE_KCAL);
  });

  it("should read a legacy manual row's calories when it is the day's only row", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthDaily.put({
      ...imported,
      sourceBridgeId: "manual",
    });

    // Act
    const sources = await loadDayEnergySources(persistence, PROFILE_ID, DATE);

    // Assert
    expect(sources.wellness?.krd.activeCalories).toBe(IMPORTED_ACTIVE_KCAL);
    expect(sources.wellness?.krd.restingCalories).toBe(IMPORTED_RESTING_KCAL);
  });

  it("should read a newer imported row's calories and a legacy manual row's steps, and a steps save changes them", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthDaily.put({
      ...imported,
      sourceBridgeId: "manual",
    });
    await persistence.healthDaily.put(whoopRow);

    // Act
    const before = await loadDayEnergySources(persistence, PROFILE_ID, DATE);
    await saveManualHealthMetric(
      { persistence, profileId: PROFILE_ID },
      { metric: "daily-wellness", day: DATE, value: MANUAL_STEPS }
    );
    const after = await loadDayEnergySources(persistence, PROFILE_ID, DATE);

    // Assert
    expect(before.wellness?.sourceBridgeId).toBe(WHOOP_BRIDGE);
    expect(before.wellness?.krd.steps).toBe(IMPORTED_STEPS);
    expect(before.wellness?.krd.activeCalories).toBe(WHOOP_ACTIVE_KCAL);
    expect(after.wellness?.krd.steps).toBe(MANUAL_STEPS);
    expect(after.wellness?.krd.activeCalories).toBe(WHOOP_ACTIVE_KCAL);
  });
});
