import { describe, expect, it } from "vitest";

import { hrvSummarySchema } from "./hrv";

const baseHrv = {
  kind: "hrv" as const,
  version: "2.0",
  measuredAt: "2026-05-22T06:00:00.000Z",
  rMSSD: 45.2,
  measurementWindow: "overnight" as const,
  score: 72,
};

describe("hrvSummarySchema", () => {
  it("should accept an overnight HRV summary with a score", () => {
    // Arrange
    const input = baseHrv;

    // Act
    const result = hrvSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept a spot measurement without a score", () => {
    // Arrange
    const withoutScore = { ...baseHrv } as Partial<typeof baseHrv>;
    delete withoutScore.score;
    const input = { ...withoutScore, measurementWindow: "spot" as const };

    // Act
    const result = hrvSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject an unknown measurement window", () => {
    // Arrange
    const input = { ...baseHrv, measurementWindow: "morning" };

    // Act
    const result = hrvSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a non-positive rMSSD", () => {
    // Arrange
    const input = { ...baseHrv, rMSSD: 0 };

    // Act
    const result = hrvSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a wrong major version", () => {
    // Arrange
    const input = { ...baseHrv, version: "1.0" };

    // Act
    const result = hrvSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
