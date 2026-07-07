import type { LabValue } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { buildLabChartData, countOutliers } from "./build-lab-chart-data";
import type { ReferenceBand } from "./reference-band";

const VIT_D_LOW = 30;
const VIT_D_HIGH = 50;
const VIT_D_OUT = 24;
const GLU_OLD = 90;
const GLU_NEW = 95;
const IN_VALUE = 90;
const LOW_VALUE = 60;
const HIGH_VALUE = 130;
const UNKNOWN_VALUE = 88;
const PLOT_A = 40;
const PLOT_B = 45;

const value = (
  overrides: Partial<LabValue> & Pick<LabValue, "id" | "date">
): LabValue => ({
  profileId: "p1",
  reportId: "r1",
  parameterKey: "glucose",
  valueRaw: 1,
  unitRaw: "mg/dL",
  valueCanonical: 1,
  unitCanonical: "mg/dL",
  refSource: "none",
  flag: "in",
  provenance: { source: "manual" },
  ...overrides,
});

describe("buildLabChartData", () => {
  it("should order points ascending by date even when the input is unsorted", () => {
    // Arrange
    const values = [
      value({ id: "v2", date: "2026-03-01", valueCanonical: GLU_NEW }),
      value({ id: "v1", date: "2026-01-01", valueCanonical: GLU_OLD }),
    ];

    // Act
    const [xs, line] = buildLabChartData(values, null);

    // Assert
    expect(xs[0]! < xs[1]!).toBe(true);
    expect(line).toEqual([GLU_OLD, GLU_NEW]);
  });

  it("should mark low/high points as outliers and leave in/unknown unmarked", () => {
    // Arrange
    const values = [
      value({
        id: "v1",
        date: "2026-01-01",
        valueCanonical: IN_VALUE,
        flag: "in",
      }),
      value({
        id: "v2",
        date: "2026-02-01",
        valueCanonical: LOW_VALUE,
        flag: "low",
      }),
      value({
        id: "v3",
        date: "2026-03-01",
        valueCanonical: HIGH_VALUE,
        flag: "high",
      }),
      value({
        id: "v4",
        date: "2026-04-01",
        valueCanonical: UNKNOWN_VALUE,
        flag: "unknown",
      }),
    ];

    // Act
    const data = buildLabChartData(values, null);

    // Assert
    expect(data[2]).toEqual([null, LOW_VALUE, HIGH_VALUE, null]);
    expect(countOutliers(data)).toBe(2);
  });

  it("should fill the band edge rows with the constant canonical bounds (C1)", () => {
    // Arrange
    const band: ReferenceBand = { low: VIT_D_LOW, high: VIT_D_HIGH };
    const values = [
      value({
        id: "v1",
        parameterKey: "vitamin_d",
        date: "2026-03-01",
        unitCanonical: "ng/mL",
        valueCanonical: VIT_D_OUT,
        flag: "low",
        refSource: "report",
        refLowCanonical: VIT_D_LOW,
        refHighCanonical: VIT_D_HIGH,
      }),
    ];

    // Act
    const data = buildLabChartData(values, band);

    // Assert
    // The point (canonical 24) sits below the canonical band 30–50 and is
    // marked out of range: the point and band share the canonical unit.
    expect(data[1]).toEqual([VIT_D_OUT]);
    expect(data[2]).toEqual([VIT_D_OUT]);
    expect(data[3]).toEqual([VIT_D_HIGH]);
    expect(data[4]).toEqual([VIT_D_LOW]);
  });

  it("should leave the band edge rows null when there is no band", () => {
    // Arrange
    const values = [value({ id: "v1", date: "2026-03-01" })];

    // Act
    const data = buildLabChartData(values, null);

    // Assert
    expect(data[3]).toEqual([null]);
    expect(data[4]).toEqual([null]);
  });

  it("should still plot every point when only some carry a range", () => {
    // Arrange
    const band: ReferenceBand = { low: VIT_D_LOW, high: VIT_D_HIGH };
    const values = [
      value({ id: "v1", date: "2026-01-01", valueCanonical: PLOT_A }),
      value({
        id: "v2",
        date: "2026-03-01",
        valueCanonical: PLOT_B,
        refLowCanonical: VIT_D_LOW,
        refHighCanonical: VIT_D_HIGH,
      }),
    ];

    // Act
    const data = buildLabChartData(values, band);

    // Assert
    expect(data[0]).toHaveLength(2);
    expect(data[1]).toEqual([PLOT_A, PLOT_B]);
  });
});
