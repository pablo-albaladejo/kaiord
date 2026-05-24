import { describe, expect, it } from "vitest";

import { stressEpisodeSchema } from "./stress";

const baseStress = {
  kind: "stress" as const,
  version: "2.0",
  startTime: "2026-05-22T14:00:00.000Z",
  endTime: "2026-05-22T14:45:00.000Z",
  averageLevel: 58,
  peakLevel: 82,
};

describe("stressEpisodeSchema", () => {
  it("should accept a valid stress episode", () => {
    // Arrange
    const input = baseStress;

    // Act
    const result = stressEpisodeSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept a zero-length episode (endTime equals startTime)", () => {
    // Arrange
    const input = { ...baseStress, endTime: baseStress.startTime };

    // Act
    const result = stressEpisodeSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject endTime before startTime", () => {
    // Arrange
    const input = {
      ...baseStress,
      endTime: "2026-05-22T13:00:00.000Z",
    };

    // Act
    const result = stressEpisodeSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(
        messages.some((m) =>
          m.includes("endTime must be greater than or equal to startTime")
        )
      ).toBe(true);
    }
  });

  it("should reject peakLevel below averageLevel", () => {
    // Arrange
    const input = { ...baseStress, averageLevel: 70, peakLevel: 60 };

    // Act
    const result = stressEpisodeSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(
        messages.some((m) =>
          m.includes("peakLevel must be greater than or equal to averageLevel")
        )
      ).toBe(true);
    }
  });

  it("should reject levels outside the 0–100 range", () => {
    // Arrange
    const input = { ...baseStress, peakLevel: 150 };

    // Act
    const result = stressEpisodeSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a wrong major version", () => {
    // Arrange
    const input = { ...baseStress, version: "1.0" };

    // Act
    const result = stressEpisodeSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
