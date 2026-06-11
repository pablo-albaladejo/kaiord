import { describe, expect, it } from "vitest";

import { dailyWellnessSchema } from "./daily";

const baseDaily = {
  kind: "daily" as const,
  version: "2.0",
  date: "2026-05-22",
  steps: 9432,
  activeCalories: 412,
  restingCalories: 1684,
  intensityMinutes: {
    moderate: 23,
    vigorous: 8,
  },
  floorsClimbed: 12,
};

describe("dailyWellnessSchema", () => {
  it("should accept a full daily wellness payload", () => {
    // Arrange
    const input = baseDaily;

    // Act
    const result = dailyWellnessSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept a payload without optional floorsClimbed", () => {
    // Arrange
    const withoutFloors = { ...baseDaily } as Partial<typeof baseDaily>;
    delete withoutFloors.floorsClimbed;

    // Act
    const result = dailyWellnessSchema.safeParse(withoutFloors);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject a negative step count", () => {
    // Arrange
    const input = { ...baseDaily, steps: -1 };

    // Act
    const result = dailyWellnessSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a date that is not ISO-date shaped", () => {
    // Arrange
    const input = { ...baseDaily, date: "2026-05-22T00:00:00Z" };

    // Act
    const result = dailyWellnessSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a missing intensityMinutes field", () => {
    // Arrange
    const withoutIntensity = { ...baseDaily } as Partial<typeof baseDaily>;
    delete withoutIntensity.intensityMinutes;

    // Act
    const result = dailyWellnessSchema.safeParse(withoutIntensity);

    // Assert
    expect(result.success).toBe(false);
  });
});
