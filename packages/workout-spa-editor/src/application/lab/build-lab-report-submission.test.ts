import { describe, expect, it } from "vitest";

import type { LabReportHeaderInput } from "./build-lab-report";
import { buildLabReportSubmission } from "./build-lab-report-submission";
import type { LabValueRowInput } from "./build-lab-value";

const HEADER: LabReportHeaderInput = {
  date: "2026-03-05",
  labName: "",
  fasting: "unspecified",
  drawTime: "",
  notes: "",
};

const row = (overrides: Partial<LabValueRowInput>): LabValueRowInput => ({
  parameterKey: "glucose",
  valueRaw: "90",
  unitRaw: "mg/dL",
  refLowRaw: "",
  refHighRaw: "",
  refTouched: false,
  ...overrides,
});

describe("buildLabReportSubmission", () => {
  it("should build one report plus one value per usable row, each with its own id", () => {
    // Arrange
    let seq = 0;
    const ctx = {
      profileId: "p1",
      reportId: "r1",
      newId: () => `v${++seq}`,
    };

    // Act
    const submission = buildLabReportSubmission(
      HEADER,
      [row({ parameterKey: "glucose" }), row({ parameterKey: "ldl" })],
      ctx
    );

    // Assert
    expect(submission?.report.id).toBe("r1");
    expect(submission?.values.map((v) => v.id)).toEqual(["v1", "v2"]);
    expect(submission?.values.map((v) => v.parameterKey)).toEqual([
      "glucose",
      "ldl",
    ]);
  });

  it("should return undefined when every row is blank", () => {
    // Arrange
    const ctx = { profileId: "p1", reportId: "r1", newId: () => "v1" };

    // Act
    const submission = buildLabReportSubmission(
      HEADER,
      [row({ parameterKey: "", valueRaw: "", unitRaw: "" })],
      ctx
    );

    // Assert
    expect(submission).toBeUndefined();
  });

  it("should drop only the blank rows, keeping the usable ones", () => {
    // Arrange
    let seq = 0;
    const ctx = { profileId: "p1", reportId: "r1", newId: () => `v${++seq}` };

    // Act
    const submission = buildLabReportSubmission(
      HEADER,
      [
        row({ parameterKey: "", valueRaw: "" }),
        row({ parameterKey: "glucose" }),
      ],
      ctx
    );

    // Assert
    expect(submission?.values).toHaveLength(1);
    expect(submission?.values[0].parameterKey).toBe("glucose");
  });
});
