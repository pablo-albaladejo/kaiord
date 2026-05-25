import { describe, expect, it } from "vitest";

import type {
  HealthDailyRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthWeightRecord,
} from "../../../../types/health/health-records";
import {
  hrvSeries,
  sleepSeries,
  stepsSeries,
  toAlignedData,
  weightSeries,
} from "./trend-series";

const MS_PER_SECOND = 1000;
const SLEEP_SCORE = 80;
const HRV_MS = 42;
const HRV_MS_ALT = 50;
const WEIGHT_KG = 70.5;
const WEIGHT_LO = 70;
const WEIGHT_HI = 71;
const STEPS = 9000;
const SECONDS_2026_01_02 = Math.floor(
  new Date("2026-01-02T00:00:00Z").getTime() / MS_PER_SECOND
);

const sleep = (date: string, score?: number): HealthSleepRecord => ({
  id: `s-${date}`,
  profileId: "p1",
  date,
  krd: {
    kind: "sleep",
    version: "2.0",
    startTime: `${date}T22:00:00Z`,
    endTime: `${date}T06:00:00Z`,
    totalDurationSeconds: 0,
    stages: [],
    score,
  },
});

const hrv = (date: string, rMSSD: number): HealthHrvRecord => ({
  id: `h-${date}`,
  profileId: "p1",
  date,
  krd: {
    kind: "hrv",
    version: "2.0",
    measuredAt: `${date}T06:00:00Z`,
    rMSSD,
    measurementWindow: "overnight",
  },
});

const weight = (date: string, kg: number): HealthWeightRecord => ({
  id: `w-${date}`,
  profileId: "p1",
  date,
  krd: {
    kind: "weight",
    version: "2.0",
    measuredAt: `${date}T06:00:00Z`,
    weightKilograms: kg,
  },
});

const daily = (date: string, steps: number): HealthDailyRecord => ({
  id: `d-${date}`,
  profileId: "p1",
  date,
  krd: {
    kind: "daily",
    version: "2.0",
    date,
    steps,
    activeCalories: 0,
    restingCalories: 0,
    intensityMinutes: { moderate: 0, vigorous: 0 },
  },
});

describe("trend-series", () => {
  it("should drop sleep records that have no score", () => {
    // Arrange
    const records = [sleep("2026-01-01", SLEEP_SCORE), sleep("2026-01-02")];

    // Act
    const points = sleepSeries(records);

    // Assert
    expect(points).toHaveLength(1);
    expect(points[0].y).toBe(SLEEP_SCORE);
  });

  it("should map HRV records to rMSSD points", () => {
    // Arrange
    const records = [hrv("2026-01-01", HRV_MS)];

    // Act
    const points = hrvSeries(records);

    // Assert
    expect(points[0].y).toBe(HRV_MS);
  });

  it("should map weight records to kilogram points", () => {
    // Arrange
    const records = [weight("2026-01-01", WEIGHT_KG)];

    // Act
    const points = weightSeries(records);

    // Assert
    expect(points[0].y).toBe(WEIGHT_KG);
  });

  it("should map daily records to step points", () => {
    // Arrange
    const records = [daily("2026-01-01", STEPS)];

    // Act
    const points = stepsSeries(records);

    // Assert
    expect(points[0].y).toBe(STEPS);
  });

  it("should sort points chronologically by date", () => {
    // Arrange
    const records = [
      weight("2026-01-03", WEIGHT_HI),
      weight("2026-01-01", WEIGHT_LO),
    ];

    // Act
    const points = weightSeries(records);

    // Assert
    expect(points[0].y).toBe(WEIGHT_LO);
    expect(points[1].y).toBe(WEIGHT_HI);
  });

  it("should convert dates to UTC midnight epoch seconds", () => {
    // Arrange
    const records = [hrv("2026-01-02", HRV_MS_ALT)];

    // Act
    const points = hrvSeries(records);

    // Assert
    expect(points[0].x).toBe(SECONDS_2026_01_02);
  });

  it("should split points into aligned x and y arrays", () => {
    // Arrange
    const points = weightSeries([
      weight("2026-01-01", WEIGHT_LO),
      weight("2026-01-02", WEIGHT_HI),
    ]);

    // Act
    const [xs, ys] = toAlignedData(points);

    // Assert
    expect(xs).toHaveLength(2);
    expect(ys).toEqual([WEIGHT_LO, WEIGHT_HI]);
  });

  it("should produce empty arrays for empty input", () => {
    // Arrange
    const points = stepsSeries([]);

    // Act
    const [xs, ys] = toAlignedData(points);

    // Assert
    expect(xs).toEqual([]);
    expect(ys).toEqual([]);
  });
});
