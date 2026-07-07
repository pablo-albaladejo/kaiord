/**
 * Lab read use cases (join + indexed passthroughs) against the in-memory repo.
 * The latest-per-parameter contract lives in
 * `get-latest-lab-values.contract.test.ts` (cross-repo, absolute values).
 */
import type { LabReport, LabValue } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { createInMemoryLabRepository } from "../../test-utils/in-memory-lab-repository";
import { getLabReport, getLabValueSeries, listLabReports } from "./lab-queries";

const report = (id: string, profileId: string, date: string): LabReport => ({
  id,
  profileId,
  date,
  provenance: { source: "manual" },
});

const value = (
  overrides: Partial<LabValue> & Pick<LabValue, "id" | "profileId">
): LabValue => ({
  reportId: "r1",
  parameterKey: "glucose",
  date: "2026-01-01",
  valueRaw: 90,
  unitRaw: "mg/dL",
  valueCanonical: 90,
  unitCanonical: "mg/dL",
  refSource: "none",
  flag: "unknown",
  provenance: { source: "manual" },
  ...overrides,
});

describe("lab read use cases", () => {
  it("should join a report with its values via getLabReport", async () => {
    // Arrange
    const labs = createInMemoryLabRepository();
    await labs.putReport(report("r1", "p1", "2026-03-05"));
    await labs.putValues([
      value({ id: "v1", profileId: "p1", reportId: "r1" }),
      value({ id: "v2", profileId: "p1", reportId: "r1", parameterKey: "ldl" }),
      value({ id: "v3", profileId: "p1", reportId: "r2" }),
    ]);

    // Act
    const detail = await getLabReport(labs, "r1");

    // Assert
    expect(detail?.report.date).toBe("2026-03-05");
    expect(detail?.values.map((v) => v.id).sort()).toEqual(["v1", "v2"]);
  });

  it("should return undefined from getLabReport for a missing report", async () => {
    // Arrange
    const labs = createInMemoryLabRepository();

    // Act
    const detail = await getLabReport(labs, "missing");

    // Assert
    expect(detail).toBeUndefined();
  });

  it("should list a profile's reports via listLabReports", async () => {
    // Arrange
    const labs = createInMemoryLabRepository();
    await labs.putReport(report("r1", "p1", "2026-01-01"));
    await labs.putReport(report("r2", "p2", "2026-02-01"));

    // Act
    const reports = await listLabReports(labs, "p1");

    // Assert
    expect(reports.map((r) => r.id)).toEqual(["r1"]);
  });

  it("should return one parameter's series via getLabValueSeries", async () => {
    // Arrange
    const labs = createInMemoryLabRepository();
    await labs.putValues([
      value({ id: "v1", profileId: "p1", parameterKey: "glucose" }),
      value({ id: "v2", profileId: "p1", parameterKey: "ldl" }),
    ]);

    // Act
    const series = await getLabValueSeries(labs, "p1", "glucose");

    // Assert
    expect(series.map((v) => v.id)).toEqual(["v1"]);
  });
});
