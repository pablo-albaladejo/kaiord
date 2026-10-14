import { describe, expect, it } from "vitest";

import type { HealthDailyRecord } from "../../types/health/health-records";
import {
  mergeDailyWellnessByDay,
  mergeDailyWellnessDay,
  type PriorityReadPolicy,
} from "./merge-daily-wellness";

const DAY = "2026-05-23";
const NEXT_DAY = "2026-05-24";
const FIT = { steps: 4000, active: 600, resting: 1700 };
const WHOOP = { steps: 5000, active: 700, resting: 1800 };
const MANUAL_STEPS = 9000;
const LEGACY = { steps: 9500, active: 640, resting: 1720 };
const NEXT_DAY_FIT = { steps: 3000, active: 500, resting: 1600 };
const FLOORS = 12;

type Values = {
  steps: number;
  active?: number;
  resting?: number;
  floors?: number;
  date?: string;
};

const row = (
  id: string,
  sourceBridgeId: string,
  values: Values
): HealthDailyRecord => {
  const date = values.date ?? DAY;
  const krd: HealthDailyRecord["krd"] = {
    kind: "daily",
    version: "2.0",
    date,
    steps: values.steps,
  };
  if (values.active !== undefined) {
    krd.activeCalories = values.active;
    krd.restingCalories = values.resting ?? 0;
    krd.intensityMinutes = { moderate: 0, vigorous: 0 };
  }
  if (values.floors !== undefined) krd.floorsClimbed = values.floors;
  return { id, profileId: "p-1", date, sourceBridgeId, krd };
};

const fit = row("f", "fit-import", FIT);
const whoop = row("w", "whoop-bridge", WHOOP);
const manual = row("m", "manual", { steps: MANUAL_STEPS });

const priority = (
  order: string[],
  disabled: string[] = []
): PriorityReadPolicy => ({ order, disabled: new Set(disabled) });

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
    const rows: HealthDailyRecord[] = [];

    // Act
    const merged = mergeDailyWellnessDay(rows);

    // Assert
    expect(merged).toBeUndefined();
  });

  it("should take the manual steps and the imported row's calories and provenance", () => {
    // Arrange
    const rows = [fit, manual];

    // Act
    const merged = mergeDailyWellnessDay(rows);

    // Assert
    expect(merged?.krd.steps).toBe(MANUAL_STEPS);
    expect(merged?.krd.activeCalories).toBe(FIT.active);
    expect(merged?.krd.restingCalories).toBe(FIT.resting);
    expect(merged?.id).toBe("f");
    expect(merged?.sourceBridgeId).toBe("fit-import");
  });

  it("should read only the steps of a manual-only day", () => {
    // Arrange
    const zeroFilled = row("m0", "manual", {
      steps: MANUAL_STEPS,
      active: 0,
      resting: 0,
    });

    // Act
    const readings = [manual, zeroFilled].map((r) =>
      mergeDailyWellnessDay([r])
    );

    // Assert
    for (const reading of readings) {
      expect(reading?.krd.steps).toBe(MANUAL_STEPS);
      expect(reading?.krd.activeCalories).toBeUndefined();
      expect(reading?.krd.restingCalories).toBeUndefined();
      expect(reading?.krd.intensityMinutes).toBeUndefined();
    }
  });

  it("should keep the calories of a legacy manual row that holds imported values", () => {
    // Arrange
    const legacy = row("legacy", "manual", LEGACY);

    // Act
    const merged = mergeDailyWellnessDay([legacy]);

    // Assert
    expect(merged?.krd.steps).toBe(LEGACY.steps);
    expect(merged?.krd.activeCalories).toBe(LEGACY.active);
    expect(merged?.krd.restingCalories).toBe(LEGACY.resting);
  });

  it("should let a newer imported row beat a legacy manual row's calories in union", () => {
    // Arrange
    const legacy = row("legacy", "manual", LEGACY);
    const days = [
      [legacy, fit],
      [legacy, whoop],
    ];

    // Act
    const readings = days.map((rows) => mergeDailyWellnessDay(rows));

    // Assert
    expect(readings.map((r) => r?.sourceBridgeId)).toEqual([
      "fit-import",
      "whoop-bridge",
    ]);
    expect(readings.map((r) => r?.krd.activeCalories)).toEqual([
      FIT.active,
      WHOOP.active,
    ]);
  });

  it("should keep genuine manual steps over a legacy manual row and an imported row", () => {
    // Arrange
    const legacy = row("legacy", "manual", LEGACY);
    const orders = permutations([legacy, whoop, manual]);

    // Act
    const readings = orders.map((rows) => mergeDailyWellnessDay(rows));

    // Assert
    for (const reading of readings) {
      expect(reading?.sourceBridgeId).toBe("whoop-bridge");
      expect(reading?.krd.steps).toBe(MANUAL_STEPS);
      expect(reading?.krd.activeCalories).toBe(WHOOP.active);
    }
  });

  it("should not give a legacy manual row the manual slot of a priority order", () => {
    // Arrange
    const legacy = row("legacy", "manual", LEGACY);
    const policy = priority(["manual", "whoop-bridge"]);

    // Act
    const withWhoop = mergeDailyWellnessDay([legacy, whoop], policy);
    const alone = mergeDailyWellnessDay([legacy], policy);

    // Assert
    expect(withWhoop?.sourceBridgeId).toBe("whoop-bridge");
    expect(withWhoop?.krd.activeCalories).toBe(WHOOP.active);
    expect(alone?.krd.activeCalories).toBe(LEGACY.active);
  });

  it("should give the same reading whatever order the rows come in", () => {
    // Arrange
    const orders = permutations([fit, whoop, manual]);

    // Act
    const readings = orders.map((rows) => mergeDailyWellnessDay(rows));

    // Assert
    for (const reading of readings) expect(reading).toEqual(readings[0]);
  });

  it("should read the whole record of the first source under priority", () => {
    // Arrange
    const fitWithFloors = row("f", "fit-import", { ...FIT, floors: FLOORS });
    const policy = priority(["whoop-bridge", "fit-import"]);

    // Act
    const merged = mergeDailyWellnessDay([fitWithFloors, whoop], policy);

    // Assert
    expect(merged?.sourceBridgeId).toBe("whoop-bridge");
    expect(merged?.krd.steps).toBe(WHOOP.steps);
    expect(merged?.krd.activeCalories).toBe(WHOOP.active);
    expect(merged?.krd.floorsClimbed).toBeUndefined();
  });

  it("should let manual steps win when the priority order ranks manual first", () => {
    // Arrange
    const policy = priority(["manual", "whoop-bridge"]);

    // Act
    const merged = mergeDailyWellnessDay([whoop, manual], policy);

    // Assert
    expect(merged?.krd.steps).toBe(MANUAL_STEPS);
    expect(merged?.krd.activeCalories).toBe(WHOOP.active);
  });

  it("should let the listed source beat manual when the priority order leaves manual out", () => {
    // Arrange
    const policy = priority(["whoop-bridge"]);

    // Act
    const merged = mergeDailyWellnessDay([manual, whoop], policy);

    // Assert
    expect(merged?.krd.steps).toBe(WHOOP.steps);
  });

  it("should fall back to an unlisted source without an import policy under priority", () => {
    // Arrange
    const policy = priority(["whoop-bridge"]);

    // Act
    const merged = mergeDailyWellnessDay([fit], policy);

    // Assert
    expect(merged?.sourceBridgeId).toBe("fit-import");
    expect(merged?.krd.activeCalories).toBe(FIT.active);
  });

  it("should drop a bridge whose import is disabled under priority", () => {
    // Arrange
    const policy = priority(["fit-import"], ["whoop-bridge"]);

    // Act
    const alone = mergeDailyWellnessDay([whoop], policy);
    const withManual = mergeDailyWellnessDay([whoop, manual], policy);

    // Assert
    expect(alone).toBeUndefined();
    expect(withManual?.sourceBridgeId).toBe("manual");
    expect(withManual?.krd.activeCalories).toBeUndefined();
  });
});

describe("mergeDailyWellnessByDay", () => {
  it("should return one reading per day, in date order", () => {
    // Arrange
    const nextDay = row("f2", "fit-import", {
      ...NEXT_DAY_FIT,
      date: NEXT_DAY,
    });

    // Act
    const merged = mergeDailyWellnessByDay([nextDay, manual, fit]);

    // Assert
    expect(
      merged.map((r) => [r.date, r.krd.steps, r.krd.activeCalories])
    ).toEqual([
      [DAY, MANUAL_STEPS, FIT.active],
      [NEXT_DAY, NEXT_DAY_FIT.steps, NEXT_DAY_FIT.active],
    ]);
  });
});
