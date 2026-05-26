import { describe, expect, it } from "vitest";

import { formatPaneValue } from "./format-pane-value";
import {
  TREND_METRICS,
  type TrendMetricDef,
  type TrendMetricKey,
} from "./trend-metrics";

const WEIGHT_KG = 72.345;
const HRV_MS = 48.4;
const SLEEP_SCORE = 82;
const STEPS_VALUE = 9432;

const byKey = (k: TrendMetricKey): TrendMetricDef =>
  TREND_METRICS.find((m) => m.key === k) as TrendMetricDef;

describe("formatPaneValue", () => {
  it("should format weight values to one decimal kilogram", () => {
    // Arrange
    const metric = byKey("weight");

    // Act
    const out = formatPaneValue(metric, WEIGHT_KG);

    // Assert
    expect(out).toBe("72.3 kg");
  });

  it("should format HRV values as integer milliseconds", () => {
    // Arrange
    const metric = byKey("hrv");

    // Act
    const out = formatPaneValue(metric, HRV_MS);

    // Assert
    expect(out).toBe("48 ms");
  });

  it("should format sleep score as a plain integer", () => {
    // Arrange
    const metric = byKey("sleep");

    // Act
    const out = formatPaneValue(metric, SLEEP_SCORE);

    // Assert
    expect(out).toBe("82");
  });

  it("should format steps with en-US thousands separator", () => {
    // Arrange
    const metric = byKey("steps");

    // Act
    const out = formatPaneValue(metric, STEPS_VALUE);

    // Assert
    expect(out).toBe("9,432 steps");
  });

  it("should return the em-dash sentinel for null values", () => {
    // Arrange
    const metric = byKey("weight");

    // Act
    const out = formatPaneValue(metric, null);

    // Assert
    expect(out).toBe("—");
  });
});
