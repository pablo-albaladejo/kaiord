/**
 * Co-located test for `useHealthDailyTodayLive`. Verifies the hook
 * resolves to the daily-wellness record for the given day.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import type { HealthDailyRecord } from "../../types/health/health-records";
import { useHealthDailyTodayLive } from "./use-health-daily-today-live";

const PROFILE_ID = "p-1";
const TODAY = "2026-05-23";
const SAMPLE_STEPS = 8000;
const SAMPLE_ACTIVE_KCAL = 400;
const SAMPLE_REST_KCAL = 1800;

const makeRecord = (id: string, date: string): HealthDailyRecord => ({
  id,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "daily",
    version: "2.0",
    date,
    steps: SAMPLE_STEPS,
    activeCalories: SAMPLE_ACTIVE_KCAL,
    restingCalories: SAMPLE_REST_KCAL,
    intensityMinutes: { moderate: 0, vigorous: 0 },
  } as unknown as HealthDailyRecord["krd"],
});

const clear = () =>
  Promise.all(
    ["healthDaily", "dataTypeSourcePolicy", "integrationPolicies"].map((t) =>
      db.table(t).clear()
    )
  );

describe("useHealthDailyTodayLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should resolve to the record persisted for today", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthDaily.put(makeRecord("d-today", TODAY));

    // Act
    const { result } = renderHook(() =>
      useHealthDailyTodayLive(PROFILE_ID, TODAY)
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    expect(result.current?.id).toBe("d-today");
  });

  it("should combine the day's imported and manual rows into one reading", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    const manualSteps = 12000;
    await persistence.healthDaily.put({
      ...makeRecord("d-imported", TODAY),
      sourceBridgeId: "fit-import",
    });
    const manual = makeRecord("d-manual", TODAY);
    await persistence.healthDaily.put({
      ...manual,
      sourceBridgeId: "manual",
      krd: { kind: "daily", version: "2.0", date: TODAY, steps: manualSteps },
    });

    // Act
    const { result } = renderHook(() =>
      useHealthDailyTodayLive(PROFILE_ID, TODAY)
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    expect(result.current?.krd.steps).toBe(manualSteps);
    expect(result.current?.krd.activeCalories).toBe(SAMPLE_ACTIVE_KCAL);
  });

  it("should re-read the day when the daily-wellness source policy changes", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    const whoopSteps = 7000;
    const manualSteps = 12000;
    const whoop = makeRecord("d-whoop", TODAY);
    await persistence.healthDaily.put({
      ...whoop,
      sourceBridgeId: "whoop-bridge",
      krd: { ...whoop.krd, steps: whoopSteps },
    });
    const manual = makeRecord("d-manual", TODAY);
    await persistence.healthDaily.put({
      ...manual,
      sourceBridgeId: "manual",
      krd: { kind: "daily", version: "2.0", date: TODAY, steps: manualSteps },
    });
    await persistence.integrationPolicy.put({
      id: "00000000-0000-4000-8000-000000000001",
      profileId: PROFILE_ID,
      dataType: "daily-wellness",
      bridgeId: "whoop-bridge",
      direction: "import",
      mode: "auto",
      enabled: true,
      updatedAt: "2026-05-01T00:00:00.000Z",
    });
    const { result } = renderHook(() =>
      useHealthDailyTodayLive(PROFILE_ID, TODAY)
    );
    await waitFor(() => {
      expect(result.current?.krd.steps).toBe(manualSteps);
    });

    // Act
    await persistence.dataTypeSourcePolicy.put({
      profileId: PROFILE_ID,
      dataType: "daily-wellness",
      mode: "priority",
      sourceOrder: ["whoop-bridge"],
    });

    // Assert
    await waitFor(() => {
      expect(result.current?.krd.steps).toBe(whoopSteps);
    });
  });
});
