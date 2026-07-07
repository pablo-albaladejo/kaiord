import { describe, expect, it } from "vitest";

import type { ChartMetricDef } from "../../../../charts/uplot-base/uplot-base";
import { buildLabChartOptions } from "./build-lab-chart-options";
import type { ReferenceBand } from "./reference-band";

const DEF: ChartMetricDef = {
  key: "vitamin_d",
  label: "Vitamin D",
  unit: "ng/mL",
};
const BAND: ReferenceBand = { kind: "band", low: 30, high: 50 };
const THRESHOLD: ReferenceBand = { kind: "threshold", high: 100 };
const REF_HIGH_IDX = 3;
const REF_LOW_IDX = 4;
const EXPECTED_SERIES = 5; // x + line + outliers + 2 band edges
const EXPECTED_AXES = 2; // x + one y
const BAND_EDGE = "rgba(37, 99, 235, 0.30)";
const THRESHOLD_STROKE = "rgba(37, 99, 235, 0.55)";

describe("buildLabChartOptions", () => {
  it("should key the y scale, axis and value series to the parameter", () => {
    // Arrange

    // Act
    const options = buildLabChartOptions(DEF, null);

    // Assert
    expect(options.scales?.[DEF.key]).toEqual({ auto: true });
    expect(options.axes).toHaveLength(EXPECTED_AXES);
    expect(options.axes?.[1]?.scale).toBe("vitamin_d");
    expect(options.series?.[1]?.scale).toBe("vitamin_d");
  });

  it("should build one line, one outlier and two band-edge series", () => {
    // Arrange

    // Act
    const options = buildLabChartOptions(DEF, BAND);

    // Assert
    expect(options.series).toHaveLength(EXPECTED_SERIES);
    expect(options.series?.[1]?.stroke).toBe("#2563eb");
    expect(options.series?.[2]?.stroke).toBe("#dc2626");
  });

  it("should draw the outlier series as points only (no connecting line)", () => {
    // Arrange

    // Act
    const options = buildLabChartOptions(DEF, BAND);
    const outlier = options.series?.[2];

    // Assert
    expect(outlier?.points?.show).toBe(true);
    expect((outlier?.paths as () => null)()).toBeNull();
  });

  it("should fill the reference band between the two edge series when a band is given", () => {
    // Arrange

    // Act
    const options = buildLabChartOptions(DEF, BAND);

    // Assert
    expect(options.bands).toHaveLength(1);
    expect(options.bands?.[0]?.series).toEqual([REF_HIGH_IDX, REF_LOW_IDX]);
  });

  it("should omit the band when no reference range is resolved", () => {
    // Arrange

    // Act
    const options = buildLabChartOptions(DEF, null);

    // Assert
    expect(options.bands).toBeUndefined();
    expect(options.series?.[REF_HIGH_IDX]?.stroke).toBe(BAND_EDGE);
  });

  it("should draw a stronger edge line and no fill for a one-sided threshold", () => {
    // Arrange

    // Act
    const options = buildLabChartOptions(DEF, THRESHOLD);

    // Assert
    expect(options.bands).toBeUndefined();
    expect(options.series?.[REF_HIGH_IDX]?.stroke).toBe(THRESHOLD_STROKE);
    expect(options.series?.[REF_LOW_IDX]?.stroke).toBe(THRESHOLD_STROKE);
  });
});
