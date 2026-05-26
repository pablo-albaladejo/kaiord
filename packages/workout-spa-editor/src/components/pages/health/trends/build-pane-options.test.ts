import { describe, expect, it } from "vitest";

import { buildPaneOptions } from "./build-pane-options";
import {
  TREND_METRICS,
  type TrendMetricDef,
  type TrendMetricKey,
} from "./trend-metrics";

const PANE_WIDTH = 640;
const PANE_HEIGHT = 180;
const STEPS_VALUE = 9432;

const byKey = (k: TrendMetricKey): TrendMetricDef =>
  TREND_METRICS.find((m) => m.key === k) as TrendMetricDef;

describe("buildPaneOptions", () => {
  it("should set the cursor sync key to the provided syncKey", () => {
    // Arrange
    const metric = byKey("sleep");
    const key = "test-sync-7";

    // Act
    const opts = buildPaneOptions(metric, PANE_WIDTH, PANE_HEIGHT, key);

    // Assert
    expect(opts.cursor?.sync?.key).toBe(key);
  });

  it("should enable live legend with show and live both true", () => {
    // Arrange
    const metric = byKey("hrv");

    // Act
    const opts = buildPaneOptions(metric, PANE_WIDTH, PANE_HEIGHT, "k");

    // Assert
    expect(opts.legend?.show).toBe(true);
    expect(opts.legend?.live).toBe(true);
  });

  it("should format the steps series value with en-US thousands separator", () => {
    // Arrange
    const metric = byKey("steps");
    const opts = buildPaneOptions(metric, PANE_WIDTH, PANE_HEIGHT, "k");
    const valueFn = opts.series[1].value as (u: unknown, v: number) => string;

    // Act
    const formatted = valueFn(undefined, STEPS_VALUE);

    // Assert
    expect(formatted).toBe("9,432 steps");
  });

  it("should return a deep-equal axes[0] across two builds with the same range", () => {
    // Arrange
    const a = buildPaneOptions(byKey("sleep"), PANE_WIDTH, PANE_HEIGHT, "k");
    const b = buildPaneOptions(byKey("steps"), PANE_WIDTH, PANE_HEIGHT, "k");

    // Act
    const ax0a = JSON.stringify(a.axes?.[0]);
    const ax0b = JSON.stringify(b.axes?.[0]);

    // Assert
    expect(ax0a).toBe(ax0b);
  });
});
