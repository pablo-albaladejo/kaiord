/**
 * Co-located test for `useHealthDailyHistoryLive`. Verifies the hook
 * resolves to the daily records persisted in the requested range.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import type { HealthDailyRecord } from "../../types/health/health-records";
import { useHealthDailyHistoryLive } from "./use-health-daily-history-live";

const PROFILE_ID = "p-1";
const RANGE = { start: "2026-05-01", end: "2026-05-31" };
const SAMPLE_STEPS = 8200;

const makeRecord = (id: string, date: string): HealthDailyRecord => ({
  id,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "daily",
    version: "2.0",
    date,
    steps: SAMPLE_STEPS,
    activeCalories: 300,
    restingCalories: 1400,
    intensityMinutes: { moderate: 20, vigorous: 5 },
  } as unknown as HealthDailyRecord["krd"],
});

const clear = () => db.table("healthDaily").clear();

describe("useHealthDailyHistoryLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should resolve to the persisted daily records inside the range", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthDaily.put(makeRecord("d-1", "2026-05-10"));

    // Act
    const { result } = renderHook(() =>
      useHealthDailyHistoryLive(PROFILE_ID, RANGE)
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });
    expect(result.current?.[0].id).toBe("d-1");
  });
});
