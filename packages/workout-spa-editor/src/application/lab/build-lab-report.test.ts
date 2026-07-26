import { describe, expect, it } from "vitest";

import { buildLabReport, type LabReportHeaderInput } from "./build-lab-report";

const CTX = { id: "r1", profileId: "p1" };

const header = (
  overrides: Partial<LabReportHeaderInput>
): LabReportHeaderInput => ({
  date: "2026-03-05",
  labName: "",
  fasting: "unspecified",
  drawTime: "",
  notes: "",
  ...overrides,
});

describe("buildLabReport", () => {
  it("should build a report with manual provenance and the required fields", () => {
    // Arrange
    const input = header({});

    // Act
    const report = buildLabReport(input, CTX);

    // Assert
    expect(report).toMatchObject({
      id: "r1",
      profileId: "p1",
      date: "2026-03-05",
      provenance: { source: "manual" },
    });
  });

  it("should omit blank optional fields instead of storing empty strings", () => {
    // Arrange
    const input = header({ labName: "  ", drawTime: "", notes: "  " });

    // Act
    const report = buildLabReport(input, CTX);

    // Assert
    expect(report.labName).toBeUndefined();
    expect(report.drawTime).toBeUndefined();
    expect(report.notes).toBeUndefined();
  });

  it("should map fasting yes/no to a boolean and unspecified to undefined", () => {
    // Arrange
    const yesHeader = header({ fasting: "yes" });
    const noHeader = header({ fasting: "no" });
    const unspecifiedHeader = header({ fasting: "unspecified" });

    // Act
    const yes = buildLabReport(yesHeader, CTX);
    const no = buildLabReport(noHeader, CTX);
    const unspecified = buildLabReport(unspecifiedHeader, CTX);

    // Assert
    expect(yes.fasting).toBe(true);
    expect(no.fasting).toBe(false);
    expect(unspecified.fasting).toBeUndefined();
  });

  it("should carry ai-extracted provenance when the context requests it", () => {
    // Arrange
    const input = header({});

    // Act
    const report = buildLabReport(input, {
      ...CTX,
      provenance: "ai-extracted",
    });

    // Assert
    expect(report.provenance).toEqual({ source: "ai-extracted" });
  });
});
