/**
 * Co-located test for `useCalendarWellnessWeekLive`.
 *
 * Asserts the three-state contract: undefined while loading; one entry
 * per day that has any of sleep/HRV/weight/steps; days with no records
 * are absent (not present-but-empty).
 */
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { PersistenceProvider } from "../../contexts/persistence-context";
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
const INTAKE_KCAL = 2000;

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider persistence={createDexiePersistence(db)}>
    {children}
  </PersistenceProvider>
);

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

const seedProfile = () =>
  db.table("profiles").put({
    id: PROFILE_ID,
    name: "Athlete",
    bodyWeight: 70,
    height: 178,
    birthDate: "1990-06-21",
    sex: "male",
    sportZones: {},
    linkedAccounts: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

const seedResolvableDay = (date: string) =>
  db.table("healthDaily").put({
    id: `wd-${date}`,
    profileId: PROFILE_ID,
    date,
    krd: {
      kind: "daily",
      version: "2.0",
      date,
      steps: 9000,
      activeCalories: 600,
      restingCalories: 1700,
      intensityMinutes: { moderate: 0, vigorous: 0 },
    },
  });

const seedIntake = (date: string, kcal: number) =>
  db.table("intakeEntries").put({
    id: `i-${date}`,
    profileId: PROFILE_ID,
    date,
    loggedAt: `${date}T12:00:00.000Z`,
    kcal,
    proteinG: 0,
    carbG: 0,
    fatG: 0,
  });

const clear = () =>
  Promise.all([
    db.table("healthSleep").clear(),
    db.table("healthHrv").clear(),
    db.table("healthWeight").clear(),
    db.table("healthDaily").clear(),
    db.table("profiles").clear(),
    db.table("intakeEntries").clear(),
  ]);

describe("useCalendarWellnessWeekLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should return undefined while the query is loading", () => {
    // Arrange
    const { result } = renderHook(
      () => useCalendarWellnessWeekLive(PROFILE_ID, WEEK_START, WEEK_END),
      { wrapper: wrap }
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
    const { result } = renderHook(
      () => useCalendarWellnessWeekLive(PROFILE_ID, WEEK_START, WEEK_END),
      { wrapper: wrap }
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
    const { result } = renderHook(
      () => useCalendarWellnessWeekLive(PROFILE_ID, WEEK_START, WEEK_END),
      { wrapper: wrap }
    );

    // Assert
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    expect(result.current?.["2026-05-18"]).toBeUndefined();
    expect(Object.keys(result.current ?? {})).toEqual(["2026-05-20"]);
  });

  it("should attach a net badge for a resolvable day with logged intake", async () => {
    // Arrange
    await seedProfile();
    await seedResolvableDay("2026-05-19");
    await seedIntake("2026-05-19", INTAKE_KCAL);

    // Act
    const { result } = renderHook(
      () => useCalendarWellnessWeekLive(PROFILE_ID, WEEK_START, WEEK_END),
      { wrapper: wrap }
    );

    // Assert
    await waitFor(() =>
      expect(result.current?.["2026-05-19"]?.net).toBeDefined()
    );
    expect(result.current?.["2026-05-19"]?.net).toBe("-300");
  });

  it("should omit the net badge for a day with untracked intake", async () => {
    // Arrange
    await seedProfile();
    await seedResolvableDay("2026-05-19");

    // Act
    const { result } = renderHook(
      () => useCalendarWellnessWeekLive(PROFILE_ID, WEEK_START, WEEK_END),
      { wrapper: wrap }
    );

    // Assert
    await waitFor(() =>
      expect(result.current?.["2026-05-19"]?.steps).toBe("9000")
    );
    expect(result.current?.["2026-05-19"]?.net).toBeUndefined();
  });
});
