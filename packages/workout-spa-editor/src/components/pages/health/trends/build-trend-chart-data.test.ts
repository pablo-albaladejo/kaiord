import { describe, expect, it } from "vitest";

import {
  buildTrendChartData,
  type PerMetricPoints,
} from "./build-trend-chart-data";
import type { TrendMetricKey } from "./trend-metrics";

const X_FIRST = 100;
const X_MID = 200;
const X_LAST = 300;
const Y_SLEEP_LOW = 80;
const Y_SLEEP_MID = 82;
const Y_SLEEP_HIGH = 85;
const Y_SLEEP_TOP = 90;
const Y_HRV_LOW = 55;
const Y_HRV_HIGH = 60;

const EMPTY_SERIES: PerMetricPoints = {
  sleep: [],
  hrv: [],
  weight: [],
  steps: [],
};

describe("buildTrendChartData", () => {
  it("should return [xs] with no y-rows when presentKeys is empty", () => {
    // Arrange
    const presentKeys: ReadonlyArray<TrendMetricKey> = [];

    // Act
    const result = buildTrendChartData(presentKeys, EMPTY_SERIES);

    // Assert
    expect(result).toEqual([[]]);
  });

  it("should merge unique x values across two metrics with overlapping dates", () => {
    // Arrange
    const presentKeys: ReadonlyArray<TrendMetricKey> = ["sleep", "hrv"];
    const series: PerMetricPoints = {
      ...EMPTY_SERIES,
      sleep: [
        { x: X_FIRST, y: Y_SLEEP_LOW },
        { x: X_MID, y: Y_SLEEP_MID },
      ],
      hrv: [
        { x: X_MID, y: Y_HRV_LOW },
        { x: X_LAST, y: Y_HRV_HIGH },
      ],
    };

    // Act
    const result = buildTrendChartData(presentKeys, series);

    // Assert
    expect(result[0]).toEqual([X_FIRST, X_MID, X_LAST]);
  });

  it("should fill missing per-x positions with literal null for the absent metric", () => {
    // Arrange
    const presentKeys: ReadonlyArray<TrendMetricKey> = ["sleep", "hrv"];
    const series: PerMetricPoints = {
      ...EMPTY_SERIES,
      sleep: [{ x: X_FIRST, y: Y_SLEEP_LOW }],
      hrv: [{ x: X_MID, y: Y_HRV_LOW }],
    };

    // Act
    const result = buildTrendChartData(presentKeys, series);

    // Assert
    expect(result[1]).toEqual([Y_SLEEP_LOW, null]);
    expect(result[2]).toEqual([null, Y_HRV_LOW]);
  });

  it("should preserve ascending x ordering even when input series are unsorted", () => {
    // Arrange
    const presentKeys: ReadonlyArray<TrendMetricKey> = ["sleep"];
    const series: PerMetricPoints = {
      ...EMPTY_SERIES,
      sleep: [
        { x: X_LAST, y: Y_SLEEP_TOP },
        { x: X_FIRST, y: Y_SLEEP_LOW },
        { x: X_MID, y: Y_SLEEP_HIGH },
      ],
    };

    // Act
    const result = buildTrendChartData(presentKeys, series);

    // Assert
    expect(result[0]).toEqual([X_FIRST, X_MID, X_LAST]);
    expect(result[1]).toEqual([Y_SLEEP_LOW, Y_SLEEP_HIGH, Y_SLEEP_TOP]);
  });
});
