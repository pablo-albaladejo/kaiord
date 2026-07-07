import { describe, expect, it } from "vitest";

import { labReportSchema } from "./lab-report";

const baseReport = {
  id: "report-1",
  profileId: "profile-1",
  date: "2026-03-05",
  labName: "Synlab",
  fasting: true,
  drawTime: "08:15",
  notes: "post rest day",
  provenance: { source: "manual" as const },
};

describe("labReportSchema", () => {
  it("should accept a full manual lab report", () => {
    // Arrange
    const input = baseReport;

    // Act
    const result = labReportSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept a minimal report without optional context", () => {
    // Arrange
    const input = {
      id: "report-2",
      profileId: "profile-1",
      date: "2026-03-05",
      provenance: { source: "manual" as const },
    };

    // Act
    const result = labReportSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject a missing profileId", () => {
    // Arrange
    const withoutProfile = { ...baseReport } as Partial<typeof baseReport>;
    delete withoutProfile.profileId;

    // Act
    const result = labReportSchema.safeParse(withoutProfile);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a non-calendar date", () => {
    // Arrange
    const input = { ...baseReport, date: "2026-03-05T08:15:00Z" };

    // Act
    const result = labReportSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a missing provenance", () => {
    // Arrange
    const withoutProvenance = { ...baseReport } as Partial<typeof baseReport>;
    delete withoutProvenance.provenance;

    // Act
    const result = labReportSchema.safeParse(withoutProvenance);

    // Assert
    expect(result.success).toBe(false);
  });
});
