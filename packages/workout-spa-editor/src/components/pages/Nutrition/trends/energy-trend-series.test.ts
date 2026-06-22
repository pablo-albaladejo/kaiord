import { describe, expect, it } from "vitest";

import {
  buildEnergyTrendData,
  type EnergyTrendKey,
  type EnergyTrendSeries,
  toEpochSeconds,
} from "./energy-trend-series";

const EMPTY: EnergyTrendSeries = {
  weightRaw: [],
  weightEma: [],
  goal: [],
  steps: [],
  sleep: [],
  training: [],
};

const KG_80 = 80;
const STEPS_9000 = 9000;

describe("buildEnergyTrendData", () => {
  it("should return only the x-row when no keys are present", () => {
    // Arrange
    const keys: ReadonlyArray<EnergyTrendKey> = [];

    // Act
    const result = buildEnergyTrendData(keys, EMPTY);

    // Assert
    expect(result).toEqual([[]]);
  });

  it("should merge unique x values across two series sharing a date", () => {
    // Arrange
    const keys: ReadonlyArray<EnergyTrendKey> = ["weightEma", "steps"];
    const series: EnergyTrendSeries = {
      ...EMPTY,
      weightEma: [
        { date: "2026-06-01", value: 80 },
        { date: "2026-06-02", value: 79 },
      ],
      steps: [{ date: "2026-06-02", value: 9000 }],
    };

    // Act
    const result = buildEnergyTrendData(keys, series);

    // Assert
    expect(result[0]).toEqual([
      toEpochSeconds("2026-06-01"),
      toEpochSeconds("2026-06-02"),
    ]);
  });

  it("should fill an absent series position with literal null", () => {
    // Arrange
    const keys: ReadonlyArray<EnergyTrendKey> = ["weightEma", "steps"];
    const series: EnergyTrendSeries = {
      ...EMPTY,
      weightEma: [{ date: "2026-06-01", value: KG_80 }],
      steps: [{ date: "2026-06-02", value: STEPS_9000 }],
    };

    // Act
    const result = buildEnergyTrendData(keys, series);

    // Assert
    expect(result[1]).toEqual([KG_80, null]);
    expect(result[2]).toEqual([null, STEPS_9000]);
  });
});
