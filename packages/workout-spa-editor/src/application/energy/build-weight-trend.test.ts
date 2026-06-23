import { describe, expect, it } from "vitest";

import type { EnergyTargetRecord } from "../../types/energy-target-record";
import type { HealthWeightRecord } from "../../types/health/health-records";
import {
  buildWeightTrend,
  DEFAULT_WEIGHT_EMA_WINDOW_DAYS,
} from "./build-weight-trend";

const PROFILE_ID = "p1";
const KG_80 = 80;
const KG_81 = 81;
const KG_79 = 79;
const KG_82 = 82;
const KG_84 = 84;
const TARGET_KG = 75;

const weight = (date: string, kg: number): HealthWeightRecord => ({
  id: `w-${date}`,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "weight",
    version: "2.0",
    measuredAt: `${date}T07:00:00.000Z`,
    weightKilograms: kg,
  } as unknown as HealthWeightRecord["krd"],
});

const target: EnergyTargetRecord = {
  profileId: PROFILE_ID,
  goalType: "fat_loss",
  startWeightKg: KG_80,
  targetWeightKg: TARGET_KG,
  targetDate: "2026-09-01",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

describe("buildWeightTrend", () => {
  it("should sort weigh-ins ascending and mirror them as raw points", () => {
    // Arrange
    const weighIns = [
      weight("2026-06-03", KG_79),
      weight("2026-06-01", KG_80),
      weight("2026-06-02", KG_81),
    ];

    // Act
    const result = buildWeightTrend({ weighIns, target: undefined });

    // Assert
    expect(result.raw.map((p) => p.date)).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
    ]);
    expect(result.raw.map((p) => p.value)).toEqual([KG_80, KG_81, KG_79]);
  });

  it("should seed the smoothed trend with the first weigh-in value", () => {
    // Arrange
    const weighIns = [weight("2026-06-01", KG_80), weight("2026-06-02", KG_82)];

    // Act
    const result = buildWeightTrend({ weighIns, target: undefined });

    // Assert
    expect(result.smoothed[0]).toEqual({ date: "2026-06-01", value: KG_80 });
    expect(result.smoothed).toHaveLength(2);
  });

  it("should smooth a noisy series below the day-to-day swing", () => {
    // Arrange
    const weighIns = [
      weight("2026-06-01", KG_80),
      weight("2026-06-02", KG_84),
      weight("2026-06-03", KG_80),
    ];

    // Act
    const result = buildWeightTrend({
      weighIns,
      target: undefined,
      windowDays: DEFAULT_WEIGHT_EMA_WINDOW_DAYS,
    });

    // Assert
    const last = result.smoothed.at(-1)!.value;
    expect(last).toBeGreaterThan(KG_80);
    expect(last).toBeLessThan(KG_84);
  });

  it("should draw a flat goal line at the target weight over the same dates", () => {
    // Arrange
    const weighIns = [weight("2026-06-01", KG_80), weight("2026-06-02", KG_79)];

    // Act
    const result = buildWeightTrend({ weighIns, target });

    // Assert
    expect(result.goalLine).toEqual([
      { date: "2026-06-01", value: TARGET_KG },
      { date: "2026-06-02", value: TARGET_KG },
    ]);
  });

  it("should omit the goal line when no active goal exists", () => {
    // Arrange
    const weighIns = [weight("2026-06-01", KG_80)];

    // Act
    const result = buildWeightTrend({ weighIns, target: undefined });

    // Assert
    expect(result.goalLine).toBeNull();
  });

  it("should omit the goal line when there are no weigh-ins to span", () => {
    // Arrange
    const weighIns: HealthWeightRecord[] = [];

    // Act
    const result = buildWeightTrend({ weighIns, target });

    // Assert
    expect(result.goalLine).toBeNull();
    expect(result.raw).toEqual([]);
    expect(result.smoothed).toEqual([]);
  });
});
