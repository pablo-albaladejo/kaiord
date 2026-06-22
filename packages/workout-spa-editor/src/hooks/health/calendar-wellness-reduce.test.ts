/**
 * Co-located test for the pure `reduceWellnessByDay` / `formatSleep`.
 * Exercises both `formatSleep` branches, the multi-metric day merge, the
 * empty-scans case, and the defensive steps-absent guard — none of which
 * the Dexie-backed hook test reaches (its sleep fixtures always carry a
 * score and its daily fixtures always carry steps).
 */
import { describe, expect, it } from "vitest";

import type {
  HealthDailyRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthWeightRecord,
} from "../../types/health/health-records";
import {
  formatSleep,
  mergeNetByDay,
  reduceWellnessByDay,
} from "./calendar-wellness-reduce";

const sleep = (
  date: string,
  krd: Partial<{ score: number; totalDurationSeconds: number }>
): HealthSleepRecord => ({
  id: `s-${date}`,
  profileId: "p-1",
  date,
  krd: {
    kind: "sleep",
    version: "2.0",
    stages: [],
    ...krd,
  } as unknown as HealthSleepRecord["krd"],
});

const hrv = (date: string): HealthHrvRecord => ({
  id: `h-${date}`,
  profileId: "p-1",
  date,
  krd: {
    kind: "hrv",
    version: "2.0",
    rMSSD: 45.6,
  } as unknown as HealthHrvRecord["krd"],
});

const weight = (date: string): HealthWeightRecord => ({
  id: `w-${date}`,
  profileId: "p-1",
  date,
  krd: {
    kind: "weight",
    version: "2.0",
    weightKilograms: 72.45,
  } as unknown as HealthWeightRecord["krd"],
});

const daily = (date: string, steps: number | undefined): HealthDailyRecord => ({
  id: `d-${date}`,
  profileId: "p-1",
  date,
  krd: {
    kind: "daily",
    version: "2.0",
    steps,
  } as unknown as HealthDailyRecord["krd"],
});

const emptyScans = { sleep: [], hrv: [], weight: [], daily: [] };
const STEPS = 9432;

describe("formatSleep", () => {
  it("should render the score when present", () => {
    // Arrange
    const krd = sleep("2026-05-19", { score: 82 }).krd;

    // Act
    const result = formatSleep(krd);

    // Assert
    expect(result).toBe("82");
  });

  it("should fall back to duration in hours when no score exists", () => {
    // Arrange
    const krd = sleep("2026-05-19", { totalDurationSeconds: 28800 }).krd;

    // Act
    const result = formatSleep(krd);

    // Assert
    expect(result).toBe("8.0h");
  });
});

describe("reduceWellnessByDay", () => {
  it("should merge multiple metrics recorded on the same day", () => {
    // Arrange
    const scans = {
      ...emptyScans,
      sleep: [sleep("2026-05-19", { score: 82 })],
      hrv: [hrv("2026-05-19")],
      weight: [weight("2026-05-19")],
      daily: [daily("2026-05-19", STEPS)],
    };

    // Act
    const result = reduceWellnessByDay(scans);

    // Assert
    expect(result["2026-05-19"]).toEqual({
      sleep: "82",
      hrv: "46",
      weight: "72.5",
      steps: "9432",
    });
  });

  it("should return an empty map when every scan is empty", () => {
    // Arrange

    // Act
    const result = reduceWellnessByDay(emptyScans);

    // Assert
    expect(result).toEqual({});
  });

  it("should omit the steps metric when a daily row has no step count", () => {
    // Arrange
    const scans = { ...emptyScans, daily: [daily("2026-05-19", undefined)] };

    // Act
    const result = reduceWellnessByDay(scans);

    // Assert
    expect(result["2026-05-19"]).toBeUndefined();
  });
});

describe("mergeNetByDay", () => {
  it("should attach a present net to an existing wellness day", () => {
    // Arrange
    const wellness = { "2026-05-19": { sleep: "82" } };
    const netByDay = { "2026-05-19": "-600" };

    // Act
    const result = mergeNetByDay(wellness, netByDay);

    // Assert
    expect(result["2026-05-19"]).toEqual({ sleep: "82", net: "-600" });
  });

  it("should create a net-only day when no other metric is present", () => {
    // Arrange
    const wellness = {};
    const netByDay = { "2026-05-20": "+300" };

    // Act
    const result = mergeNetByDay(wellness, netByDay);

    // Assert
    expect(result["2026-05-20"]).toEqual({ net: "+300" });
  });

  it("should skip days whose net is null", () => {
    // Arrange
    const wellness = { "2026-05-19": { sleep: "82" } };
    const netByDay = { "2026-05-19": null, "2026-05-20": null };

    // Act
    const result = mergeNetByDay(wellness, netByDay);

    // Assert
    expect(result["2026-05-19"]).toEqual({ sleep: "82" });
    expect(result["2026-05-20"]).toBeUndefined();
  });
});
