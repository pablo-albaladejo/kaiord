import { describe, expect, it } from "vitest";

import type { HealthDailyRecord } from "../../types/health/health-records";
import {
  mergeDailyWellnessByDay,
  mergeDailyWellnessDay,
} from "./merge-daily-wellness";

const DAY = "2026-05-23";
const NEXT_DAY = "2026-05-24";
const GARMIN = { steps: 4000, active: 600, resting: 1700 };
const WHOOP = { steps: 5000, active: 700, resting: 1800 };
const MANUAL_STEPS = 9000;
const NEXT_DAY_GARMIN = { steps: 3000, active: 500, resting: 1600 };

const row = (
  id: string,
  sourceBridgeId: string,
  values: { steps: number; active: number; resting: number; date?: string }
): HealthDailyRecord => ({
  id,
  profileId: "p-1",
  date: values.date ?? DAY,
  sourceBridgeId,
  krd: {
    kind: "daily",
    version: "2.0",
    date: values.date ?? DAY,
    steps: values.steps,
    activeCalories: values.active,
    restingCalories: values.resting,
    intensityMinutes: { moderate: 0, vigorous: 0 },
  },
});

const garmin = row("g", "garmin-bridge", GARMIN);
const whoop = row("w", "whoop-bridge", WHOOP);
const manual = row("m", "manual", {
  steps: MANUAL_STEPS,
  active: 0,
  resting: 0,
});

const permutations = <T>(items: T[]): T[][] =>
  items.length <= 1
    ? [items]
    : items.flatMap((item, i) =>
        permutations([...items.slice(0, i), ...items.slice(i + 1)]).map(
          (rest) => [item, ...rest]
        )
      );

describe("mergeDailyWellnessDay", () => {
  it("should return undefined for a day with no rows", () => {
    // Arrange

    // Act
    const merged = mergeDailyWellnessDay([]);

    // Assert
    expect(merged).toBeUndefined();
  });

  it("should take the manual steps and keep the imported calories", () => {
    // Arrange

    // Act
    const merged = mergeDailyWellnessDay([garmin, manual]);

    // Assert
    expect(merged?.krd.steps).toBe(MANUAL_STEPS);
    expect(merged?.krd.activeCalories).toBe(GARMIN.active);
    expect(merged?.krd.restingCalories).toBe(GARMIN.resting);
  });

  it("should keep a manual-only day as entered", () => {
    // Arrange

    // Act
    const merged = mergeDailyWellnessDay([manual]);

    // Assert
    expect(merged?.krd.steps).toBe(MANUAL_STEPS);
    expect(merged?.sourceBridgeId).toBe("manual");
  });

  it("should give the same reading whatever order the rows come in", () => {
    // Arrange
    const orders = permutations([garmin, whoop, manual]);

    // Act
    const readings = orders.map((rows) => mergeDailyWellnessDay(rows));

    // Assert
    for (const reading of readings) expect(reading).toEqual(readings[0]);
  });

  it("should follow the priority sourceOrder when one is set", () => {
    // Arrange
    const order = ["whoop-bridge", "manual", "garmin-bridge"];

    // Act
    const merged = mergeDailyWellnessDay([garmin, manual, whoop], order);

    // Assert
    expect(merged?.krd.steps).toBe(WHOOP.steps);
    expect(merged?.krd.activeCalories).toBe(WHOOP.active);
  });

  it("should let the manual steps win over every imported source by default", () => {
    // Arrange

    // Act
    const merged = mergeDailyWellnessDay([whoop, garmin, manual]);

    // Assert
    expect(merged?.krd.steps).toBe(MANUAL_STEPS);
  });
});

describe("mergeDailyWellnessByDay", () => {
  it("should return one reading per day, in date order", () => {
    // Arrange
    const nextDay = row("g2", "garmin-bridge", {
      ...NEXT_DAY_GARMIN,
      date: NEXT_DAY,
    });

    // Act
    const merged = mergeDailyWellnessByDay([nextDay, manual, garmin]);

    // Assert
    expect(
      merged.map((r) => [r.date, r.krd.steps, r.krd.activeCalories])
    ).toEqual([
      [DAY, MANUAL_STEPS, GARMIN.active],
      [NEXT_DAY, NEXT_DAY_GARMIN.steps, NEXT_DAY_GARMIN.active],
    ]);
  });
});
