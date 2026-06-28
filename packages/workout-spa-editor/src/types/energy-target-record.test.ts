import { describe, expect, it } from "vitest";

import { energyTargetRecordSchema } from "./energy-target-record";

const VALID = {
  profileId: "p-1",
  goalType: "fat_loss" as const,
  startWeightKg: 80,
  targetWeightKg: 75,
  targetDate: "2026-09-01",
  createdAt: "2026-06-21T08:00:00.000Z",
  updatedAt: "2026-06-21T08:00:00.000Z",
};

describe("energyTargetRecordSchema", () => {
  it("should accept each supported goal type", () => {
    // Arrange
    const inputs = (["fat_loss", "muscle_gain", "maintain"] as const).map(
      (goalType) => ({ ...VALID, goalType })
    );

    // Act
    const results = inputs.map((i) => energyTargetRecordSchema.safeParse(i));

    // Assert
    expect(results.every((r) => r.success)).toBe(true);
  });

  it("should reject an unknown goal type", () => {
    // Arrange
    const input = { ...VALID, goalType: "recomp" };

    // Act
    const result = energyTargetRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a non-positive start weight", () => {
    // Arrange
    const input = { ...VALID, startWeightKg: 0 };

    // Act
    const result = energyTargetRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a malformed target date", () => {
    // Arrange
    const input = { ...VALID, targetDate: "September 2026" };

    // Act
    const result = energyTargetRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an unknown field via strict mode", () => {
    // Arrange
    const input = { ...VALID, weeklyDeltaKg: 0.5 };

    // Act
    const result = energyTargetRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
