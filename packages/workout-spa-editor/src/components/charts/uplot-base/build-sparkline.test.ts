import { describe, expect, it } from "vitest";

import {
  buildSparklineData,
  buildSparklineOptions,
  type SparklinePoint,
} from "./build-sparkline";

const X_A = 100;
const X_B = 200;
const X_C = 300;
const Y_A = 10;
const Y_B = 20;
const Y_C = 30;
const SPARK_WIDTH = 120;
const SPARK_HEIGHT = 28;

describe("buildSparklineData", () => {
  it("should return aligned [xs, ys] in ascending x order", () => {
    // Arrange
    const points: SparklinePoint[] = [
      { x: X_C, y: Y_C },
      { x: X_A, y: Y_A },
      { x: X_B, y: Y_B },
    ];

    // Act
    const [xs, ys] = buildSparklineData(points);

    // Assert
    expect(xs).toEqual([X_A, X_B, X_C]);
    expect(ys).toEqual([Y_A, Y_B, Y_C]);
  });

  it("should return empty rows for an empty series", () => {
    // Arrange
    const points: SparklinePoint[] = [];

    // Act
    const result = buildSparklineData(points);

    // Assert
    expect(result).toEqual([[], []]);
  });
});

describe("buildSparklineOptions", () => {
  it("should hide both axes, the legend, and the cursor", () => {
    // Arrange
    const style = { width: SPARK_WIDTH, height: SPARK_HEIGHT };

    // Act
    const options = buildSparklineOptions(style);

    // Assert
    expect(options.axes?.every((a) => a.show === false)).toBe(true);
    expect(options.legend?.show).toBe(false);
    expect(options.cursor?.show).toBe(false);
  });

  it("should apply a custom stroke to the single data series", () => {
    // Arrange
    const stroke = "#dc2626";

    // Act
    const options = buildSparklineOptions({
      width: SPARK_WIDTH,
      height: SPARK_HEIGHT,
      stroke,
    });

    // Assert
    expect(options.series?.[1]?.stroke).toBe(stroke);
  });
});
