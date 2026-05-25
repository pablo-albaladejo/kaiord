/**
 * Co-located test for `useCalendarWellnessWeekLive`.
 *
 * Asserts the three-state contract: undefined while loading; one entry
 * per day that has any of sleep/HRV/weight/steps; days with no records
 * are absent (not present-but-empty).
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import type {
  HealthDailyRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthWeightRecord,
} from "../../types/health/health-records";
import { useCalendarWellnessWeekLive } from "./use-calendar-wellness-week-live";

const PROFILE_ID = "p-1";
const WEEK_START = "2026-05-18";
const WEEK_END = "2026-05-24";

const sleep = (id: string, date: string): HealthSleepRecord => ({
  id,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "sleep",
    version: "2.0",
    startTime: `${date}T22:00:00.000Z`,
    endTime: `${date}T23:00:00.000Z`,
    totalDurationSeconds: 0,
    stages: [],
    score: 82,
  } as unknown as HealthSleepRecord["krd"],
});

const weight = (id: string, date: string): HealthWeightRecord => ({
  id,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "weight",
    version: "2.0",
    measuredAt: `${date}T07:00:00.000Z`,
    weightKilograms: 72.4,
  } as unknown as HealthWeightRecord["krd"],
});

const hrv = (id: string, date: string): HealthHrvRecord => ({
  id,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "hrv",
    version: "2.0",
    measuredAt: `${date}T07:00:00.000Z`,
    rMSSD: 45,
    measurementWindow: "overnight",
  } as unknown as HealthHrvRecord["krd"],
});

const daily = (id: string, date: string): HealthDailyRecord => ({
  id,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "daily",
    version: "2.0",
    date,
    steps: 9432,
    activeCalories: 0,
    restingCalories: 0,
    intensityMinutes: { moderate: 0, vigorous: 0 },
  } as unknown as HealthDailyRecord["krd"],
});

const clear = () =>
  Promise.all([
    db.table("healthSleep").clear(),
    db.table("healthHrv").clear(),
    db.table("healthWeight").clear(),
    db.table("healthDaily").clear(),
  ]);

describe("useCalendarWellnessWeekLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should return undefined while the query is loading", () => {
    // Arrange
    const { result } = renderHook(() =>
      useCalendarWellnessWeekLive(PROFILE_ID, WEEK_START, WEEK_END)
    );

    // Act
    const initial = result.current;

    // Assert
    expect(initial).toBeUndefined();
  });

  it("should produce one entry per day that has any metric", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthSleep.put(sleep("s-1", "2026-05-19"));
    await persistence.healthWeight.put(weight("w-1", "2026-05-20"));
    await persistence.healthHrv.put(hrv("h-1", "2026-05-19"));
    await persistence.healthDaily.put(daily("d-1", "2026-05-19"));

    // Act
    const { result } = renderHook(() =>
      useCalendarWellnessWeekLive(PROFILE_ID, WEEK_START, WEEK_END)
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    expect(result.current?.["2026-05-19"]).toEqual({
      sleep: "82",
      hrv: "45",
      steps: "9432",
    });
    expect(result.current?.["2026-05-20"]).toEqual({ weight: "72.4" });
  });

  it("should omit days that have no wellness records", async () => {
    // Arrange
    const persistence = createDexiePersistence(db);
    await persistence.healthWeight.put(weight("w-1", "2026-05-20"));

    // Act
    const { result } = renderHook(() =>
      useCalendarWellnessWeekLive(PROFILE_ID, WEEK_START, WEEK_END)
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    expect(result.current?.["2026-05-18"]).toBeUndefined();
    expect(Object.keys(result.current ?? {})).toEqual(["2026-05-20"]);
  });
});
