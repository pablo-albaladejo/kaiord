import { describe, expect, it } from "vitest";

import { buildTrendOptions } from "./trend-chart-options";

describe("buildTrendOptions", () => {
  it("should apply the requested width and height", () => {
    // Arrange
    const width = 500;
    const height = 200;

    // Act
    const options = buildTrendOptions("Weight", "kg", width, height);

    // Assert
    expect(options.width).toBe(width);
    expect(options.height).toBe(height);
  });

  it("should label the value series with metric and unit", () => {
    // Arrange

    // Act
    const options = buildTrendOptions("HRV", "ms", 400, 200);

    // Assert
    expect(options.series[1].label).toBe("HRV (ms)");
  });

  it("should configure a time-based x scale", () => {
    // Arrange

    // Act
    const options = buildTrendOptions("Sleep", "score", 400, 200);

    // Assert
    expect(options.scales?.x?.time).toBe(true);
  });
});
