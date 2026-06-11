import { describe, expect, it } from "vitest";

import { weightMeasurementSchema } from "./weight";

const baseWeight = {
  kind: "weight" as const,
  version: "2.0",
  measuredAt: "2026-05-22T07:15:00.000Z",
  weightKilograms: 72.4,
};

describe("weightMeasurementSchema", () => {
  it("should accept a scalar weight measurement", () => {
    // Arrange
    const input = baseWeight;

    // Act
    const result = weightMeasurementSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject a non-positive weight", () => {
    // Arrange
    const input = { ...baseWeight, weightKilograms: 0 };

    // Act
    const result = weightMeasurementSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a missing weightKilograms field", () => {
    // Arrange
    const withoutWeight = { ...baseWeight } as Partial<typeof baseWeight>;
    delete withoutWeight.weightKilograms;

    // Act
    const result = weightMeasurementSchema.safeParse(withoutWeight);

    // Assert
    expect(result.success).toBe(false);
  });
});
