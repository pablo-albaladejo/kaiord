import { describe, expect, it } from "vitest";

import { buildEnergyTrendOptions } from "./build-energy-trend-options";
import type { EnergyTrendKey } from "./energy-trend-series";

const TWO_SERIES_PLUS_X = 3;

describe("buildEnergyTrendOptions", () => {
  it("should produce one series per present key plus the x placeholder", () => {
    // Arrange
    const keys: ReadonlyArray<EnergyTrendKey> = ["weightEma", "steps"];

    // Act
    const options = buildEnergyTrendOptions(keys);

    // Assert
    expect(options.series).toHaveLength(TWO_SERIES_PLUS_X);
    expect(options.series[1]?.label).toBe("Weight trend");
    expect(options.series[2]?.label).toBe("Steps");
  });

  it("should co-scale weight raw, ema, and goal on the weight scale", () => {
    // Arrange
    const keys: ReadonlyArray<EnergyTrendKey> = [
      "weightRaw",
      "weightEma",
      "goal",
    ];

    // Act
    const options = buildEnergyTrendOptions(keys);

    // Assert
    const scales = options.series.slice(1).map((s) => s.scale);
    expect(scales).toEqual(["weight", "weight", "weight"]);
  });

  it("should give overlay series their own auto scales", () => {
    // Arrange
    const keys: ReadonlyArray<EnergyTrendKey> = ["steps", "sleep", "training"];

    // Act
    const options = buildEnergyTrendOptions(keys);

    // Assert
    expect(options.scales?.steps).toEqual({ auto: true });
    expect(options.scales?.sleep).toEqual({ auto: true });
    expect(options.scales?.training).toEqual({ auto: true });
  });
});
