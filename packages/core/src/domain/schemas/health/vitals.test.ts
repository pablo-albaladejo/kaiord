import { describe, expect, it } from "vitest";

import { vitalsSummarySchema } from "./vitals";

const baseMeasuredAt = "2026-07-10T05:30:00.000Z";

describe("vitalsSummarySchema", () => {
  it("should accept a full vitals payload", () => {
    // Arrange
    const input = {
      kind: "vitals" as const,
      version: "2.0",
      measuredAt: baseMeasuredAt,
      respiratoryRate: 17.1,
      spo2Percent: 96,
      skinTempCelsius: 35.4,
      restingHeartRate: 51,
    };

    // Act
    const result = vitalsSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept a payload with only spo2Percent", () => {
    // Arrange
    const input = {
      kind: "vitals" as const,
      version: "2.0",
      measuredAt: baseMeasuredAt,
      spo2Percent: 96,
    };

    // Act
    const result = vitalsSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject a payload with no measurement fields", () => {
    // Arrange
    const input = {
      kind: "vitals" as const,
      version: "2.0",
      measuredAt: baseMeasuredAt,
    };

    // Act
    const result = vitalsSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(
        messages.some((m) => m.includes("At least one vitals field"))
      ).toBe(true);
    }
  });

  it("should reject a spo2Percent above 100", () => {
    // Arrange
    const input = {
      kind: "vitals" as const,
      version: "2.0",
      measuredAt: baseMeasuredAt,
      spo2Percent: 150,
    };

    // Act
    const result = vitalsSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
