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

const clear = () => db.table("healthDaily").clear();

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
});
