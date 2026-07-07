import type { LabValue } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { buildLabParameterSummaries } from "./build-lab-parameter-summaries";

const GLUCOSE_OLD = 90;
const GLUCOSE_NEW = 95;

const value = (
  overrides: Partial<LabValue> & Pick<LabValue, "id" | "parameterKey" | "date">
): LabValue => ({
  profileId: "p1",
  reportId: "r1",
  valueRaw: 1,
  unitRaw: "mg/dL",
  valueCanonical: 1,
  unitCanonical: "mg/dL",
  refSource: "none",
  flag: "unknown",
  provenance: { source: "manual" },
  ...overrides,
});

describe("buildLabParameterSummaries", () => {
  it("should keep the latest value per parameter across reports", () => {
    // Arrange
    const values: LabValue[] = [
      value({
        id: "v1",
        parameterKey: "glucose",
        date: "2026-01-01",
        valueCanonical: GLUCOSE_OLD,
      }),
      value({
        id: "v2",
        parameterKey: "glucose",
        date: "2026-03-01",
        valueCanonical: GLUCOSE_NEW,
      }),
    ];

    // Act
    const summaries = buildLabParameterSummaries(values);

    // Assert
    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.latest.valueCanonical).toBe(GLUCOSE_NEW);
  });

  it("should still surface a parameter measured only in an older report (DoD-4)", () => {
    // Arrange
    const values: LabValue[] = [
      value({ id: "v1", parameterKey: "glucose", date: "2026-03-01" }),
      value({ id: "v2", parameterKey: "ferritin", date: "2025-06-01" }),
    ];

    // Act
    const summaries = buildLabParameterSummaries(values);
    const keys = summaries.map((s) => s.parameterKey);

    // Assert
    expect(keys).toContain("ferritin");
  });

  it("should collect each parameter's full series as x-sorted sparkline points", () => {
    // Arrange
    const values: LabValue[] = [
      value({
        id: "v2",
        parameterKey: "glucose",
        date: "2026-03-01",
        valueCanonical: GLUCOSE_NEW,
      }),
      value({
        id: "v1",
        parameterKey: "glucose",
        date: "2026-01-01",
        valueCanonical: GLUCOSE_OLD,
      }),
    ];

    // Act
    const summaries = buildLabParameterSummaries(values);
    const points = summaries[0]?.points ?? [];

    // Assert
    expect(points.map((p) => p.y)).toEqual([GLUCOSE_OLD, GLUCOSE_NEW]);
    expect(points[0]!.x).toBeLessThan(points[1]!.x);
  });
});
