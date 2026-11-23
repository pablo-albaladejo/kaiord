import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appI18n, setActiveLocale } from "../../../../i18n/i18n";
import { buildTrendChartOptions } from "./build-trend-chart-options";
import { TREND_METRICS } from "./trend-metrics";

describe("buildTrendChartOptions metric names", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should name each metric's series and axis in Spanish", () => {
    // Arrange
    const metrics = TREND_METRICS.filter((m) => m.key !== "hrv");

    // Act
    const options = buildTrendChartOptions(metrics, "metric", "es");

    // Assert
    expect(options.series?.slice(1).map((s) => s.label)).toEqual([
      "Sueño",
      "Peso",
      "Pasos",
    ]);
    expect(options.axes?.[1]?.label).toBe("Sueño");
  });

  it("should name each metric in English by default", () => {
    // Arrange
    const metrics = TREND_METRICS;

    // Act
    const options = buildTrendChartOptions(metrics);

    // Assert
    expect(options.series?.slice(1).map((s) => s.label)).toEqual([
      "Sleep",
      "HRV",
      "Weight",
      "Steps",
    ]);
  });
});
