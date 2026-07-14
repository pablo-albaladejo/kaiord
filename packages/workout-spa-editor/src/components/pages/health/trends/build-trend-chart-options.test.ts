import { describe, expect, it } from "vitest";

import { buildTrendChartOptions } from "./build-trend-chart-options";
import type { TrendMetricDef } from "./trend-metrics";

const SLEEP: TrendMetricDef = { key: "sleep", label: "Sleep", unit: "score" };
const HRV: TrendMetricDef = { key: "hrv", label: "HRV", unit: "ms" };
const WEIGHT: TrendMetricDef = { key: "weight", label: "Weight", unit: "kg" };

const EXPECTED_AXES_COUNT_3_METRICS = 4; // 1 X + 3 Y
// Fallback theme colors from chart-theme.ts (no DOM custom properties set in
// this pure-function test, so getChartAxisColors returns its defaults).
const AXIS_STROKE = "#64748b";
const GRID_STROKE = "#e2e8f0";

describe("buildTrendChartOptions", () => {
  it("should produce one X axis plus one Y axis per metric in the input order", () => {
    // Arrange
    const metrics: ReadonlyArray<TrendMetricDef> = [SLEEP, HRV, WEIGHT];

    // Act
    const options = buildTrendChartOptions(metrics);

    // Assert
    expect(options.axes).toHaveLength(EXPECTED_AXES_COUNT_3_METRICS);
    expect(options.axes?.[1]?.scale).toBe("sleep");
    expect(options.axes?.[2]?.scale).toBe("hrv");
    expect(options.axes?.[3]?.scale).toBe("weight");
  });

  it("should set each Y series scale key to the metric key", () => {
    // Arrange
    const metrics: ReadonlyArray<TrendMetricDef> = [SLEEP, HRV];

    // Act
    const options = buildTrendChartOptions(metrics);

    // Assert
    const ySeriesScales = (options.series ?? []).slice(1).map((s) => s.scale);
    expect(ySeriesScales).toEqual(["sleep", "hrv"]);
  });

  it("should render uniform stroke #2563eb on every series", () => {
    // Arrange
    const metrics: ReadonlyArray<TrendMetricDef> = [SLEEP, HRV, WEIGHT];

    // Act
    const options = buildTrendChartOptions(metrics);

    // Assert
    const strokes = (options.series ?? []).slice(1).map((s) => s.stroke);
    expect(strokes).toEqual(["#2563eb", "#2563eb", "#2563eb"]);
  });

  it("should pack all Y axes on side 1 (right edge)", () => {
    // Arrange
    const metrics: ReadonlyArray<TrendMetricDef> = [SLEEP, HRV, WEIGHT];

    // Act
    const options = buildTrendChartOptions(metrics);

    // Assert
    const sides = (options.axes ?? []).slice(1).map((a) => a.side);
    expect(sides).toEqual([1, 1, 1]);
  });

  it("should theme every axis with the current stroke/grid/tick colors", () => {
    // Arrange
    const metrics: ReadonlyArray<TrendMetricDef> = [SLEEP, HRV];

    // Act
    const options = buildTrendChartOptions(metrics);

    // Assert
    for (const axis of options.axes ?? []) {
      expect(axis.stroke).toBe(AXIS_STROKE);
      expect(axis.grid).toEqual({ stroke: GRID_STROKE });
      expect(axis.ticks).toEqual({ stroke: GRID_STROKE });
    }
  });
});
