import { describe, expect, it } from "vitest";

import { seriesStroke } from "../../../charts/uplot-base/series-strokes";
import { buildTrendChartOptions } from "./build-trend-chart-options";
import { TREND_METRICS, type TrendMetricDef } from "./trend-metrics";

const byKey = (key: TrendMetricDef["key"]): TrendMetricDef =>
  TREND_METRICS.find((m) => m.key === key) as TrendMetricDef;

const SLEEP = byKey("sleep");
const HRV = byKey("hrv");
const WEIGHT = byKey("weight");
const STEPS = byKey("steps");

const EXPECTED_AXES_COUNT_3_METRICS = 4; // 1 X + 3 Y
// Fallback theme colors from chart-theme.ts (no DOM custom properties set in
// this pure-function test, so getChartAxisColors returns its defaults).
const AXIS_STROKE = "#747474";
const GRID_STROKE = "#d4d4d4";

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

  it("should stroke each series with its own step of the neutral ink ladder", () => {
    // Arrange
    const metrics: ReadonlyArray<TrendMetricDef> = [SLEEP, HRV, WEIGHT];

    // Act
    const options = buildTrendChartOptions(metrics);

    // Assert
    const strokes = (options.series ?? []).slice(1).map((s) => s.stroke);
    expect(strokes).toEqual([
      seriesStroke(SLEEP.strokeStep),
      seriesStroke(HRV.strokeStep),
      seriesStroke(WEIGHT.strokeStep),
    ]);
    expect(new Set(strokes).size).toBe(metrics.length);
  });

  it("should keep a metric's stroke stable when another metric is dropped", () => {
    // Arrange
    const metrics: ReadonlyArray<TrendMetricDef> = [WEIGHT];

    // Act
    const alone = buildTrendChartOptions(metrics);
    const withOthers = buildTrendChartOptions([SLEEP, HRV, WEIGHT]);

    // Assert
    expect(alone.series?.[1]?.stroke).toBe(withOthers.series?.[3]?.stroke);
  });

  it("should dash the series that wraps onto an already-used ladder step", () => {
    // Arrange
    const metrics: ReadonlyArray<TrendMetricDef> = [SLEEP, STEPS];

    // Act
    const options = buildTrendChartOptions(metrics);

    // Assert
    expect(options.series?.[1]?.stroke).toBe(options.series?.[2]?.stroke);
    expect(options.series?.[1]?.dash).toBeUndefined();
    expect(options.series?.[2]?.dash).toEqual(STEPS.dash);
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
