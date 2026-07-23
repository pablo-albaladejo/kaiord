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
const STEPS_VALUE_GROUPED = 94321;

const byKey = (k: TrendMetricKey): TrendMetricDef =>
  TREND_METRICS.find((m) => m.key === k) as TrendMetricDef;

describe("formatPaneValue", () => {
  it.each([
    {
      scenario: "weight to one decimal kilogram",
      key: "weight",
      value: WEIGHT_KG,
      units: "metric",
      locale: "en",
      expected: "72.3 kg",
    },
    {
      scenario: "weight in pounds for imperial units",
      key: "weight",
      value: WEIGHT_KG,
      units: "imperial",
      locale: "en",
      expected: "159.5 lb",
    },
    {
      scenario: "HRV as integer milliseconds",
      key: "hrv",
      value: HRV_MS,
      units: "metric",
      locale: "en",
      expected: "48 ms",
    },
    {
      scenario: "sleep score as a plain integer",
      key: "sleep",
      value: SLEEP_SCORE,
      units: "metric",
      locale: "en",
      expected: "82",
    },
    {
      scenario: "steps with the en-US thousands separator",
      key: "steps",
      value: STEPS_VALUE,
      units: "metric",
      locale: "en",
      expected: "9,432 steps",
    },
    {
      scenario: "steps with the es thousands separator",
      key: "steps",
      value: STEPS_VALUE_GROUPED,
      units: "metric",
      locale: "es",
      expected: "94.321 steps",
    },
    {
      scenario: "the em-dash sentinel for null values",
      key: "weight",
      value: null,
      units: "metric",
      locale: "en",
      expected: "—",
    },
  ] as const)(
    "should format $scenario",
    ({ key, value, units, locale, expected }) => {
      // Arrange
      const metric = byKey(key);

      // Act
      const out = formatPaneValue(metric, value, units, locale);

      // Assert
      expect(out).toBe(expected);
    }
  );
});
