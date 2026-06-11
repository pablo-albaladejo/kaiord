import { describe, expect, it } from "vitest";

import { bodyCompositionSchema } from "./body-composition";

const baseMeasuredAt = "2026-05-22T07:15:00.000Z";

describe("bodyCompositionSchema", () => {
  it("should accept a payload with only bodyFatPercent", () => {
    // Arrange
    const input = {
      kind: "bodyComposition" as const,
      version: "2.0",
      measuredAt: baseMeasuredAt,
      bodyFatPercent: 18.4,
    };

    // Act
    const result = bodyCompositionSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept a full payload with every optional field", () => {
    // Arrange
    const input = {
      kind: "bodyComposition" as const,
      version: "2.0",
      measuredAt: baseMeasuredAt,
      bodyFatPercent: 18.4,
      leanMassKilograms: 58.2,
      boneMassKilograms: 3.1,
      bodyWaterPercent: 56.1,
      bmi: 22.7,
    };

    // Act
    const result = bodyCompositionSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject a payload with no measurement fields", () => {
    // Arrange
    const input = {
      kind: "bodyComposition" as const,
      version: "2.0",
      measuredAt: baseMeasuredAt,
    };

    // Act
    const result = bodyCompositionSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(
        messages.some((m) => m.includes("At least one body-composition field"))
      ).toBe(true);
    }
  });

  it("should reject a bodyFatPercent above 100", () => {
    // Arrange
    const input = {
      kind: "bodyComposition" as const,
      version: "2.0",
      measuredAt: baseMeasuredAt,
      bodyFatPercent: 150,
    };

    // Act
    const result = bodyCompositionSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
