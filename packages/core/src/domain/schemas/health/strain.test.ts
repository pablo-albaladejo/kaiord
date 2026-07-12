import { describe, expect, it } from "vitest";

import { strainSummarySchema } from "./strain";

const baseDate = "2026-07-10";

describe("strainSummarySchema", () => {
  it("should accept a full strain payload", () => {
    // Arrange
    const input = {
      kind: "strain" as const,
      version: "2.0",
      date: baseDate,
      strainScore: 5.36,
      dayAverageHeartRate: 58,
      dayMaxHeartRate: 127,
      energyKilojoules: 7045,
    };

    // Act
    const result = strainSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept a minimal strain payload with only strainScore", () => {
    // Arrange
    const input = {
      kind: "strain" as const,
      version: "2.0",
      date: baseDate,
      strainScore: 0,
    };

    // Act
    const result = strainSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject a strainScore above 21", () => {
    // Arrange
    const input = {
      kind: "strain" as const,
      version: "2.0",
      date: baseDate,
      strainScore: 25,
    };

    // Act
    const result = strainSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject dayMaxHeartRate below dayAverageHeartRate", () => {
    // Arrange
    const input = {
      kind: "strain" as const,
      version: "2.0",
      date: baseDate,
      strainScore: 5,
      dayAverageHeartRate: 120,
      dayMaxHeartRate: 100,
    };

    // Act
    const result = strainSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(
        messages.some((m) => m.includes("dayMaxHeartRate must be greater"))
      ).toBe(true);
    }
  });
});
