import { describe, expect, it } from "vitest";

import { intakePresetRecordSchema } from "./intake-preset-record";

const VALID = {
  id: "pre-1",
  profileId: "p-1",
  label: "My usual breakfast",
  kcal: 400,
  proteinG: 20,
  carbG: 50,
  fatG: 10,
  defaultMealSlot: "breakfast" as const,
  createdAt: "2026-06-21T08:00:00.000Z",
};

describe("intakePresetRecordSchema", () => {
  it("should accept a fully-populated preset", () => {
    // Arrange
    const input = VALID;

    // Act
    const result = intakePresetRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept a preset without a default meal slot", () => {
    // Arrange
    const input = {
      id: VALID.id,
      profileId: VALID.profileId,
      label: VALID.label,
      kcal: VALID.kcal,
      proteinG: VALID.proteinG,
      carbG: VALID.carbG,
      fatG: VALID.fatG,
      createdAt: VALID.createdAt,
    };

    // Act
    const result = intakePresetRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject an empty label", () => {
    // Arrange
    const input = { ...VALID, label: "" };

    // Act
    const result = intakePresetRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a negative macro value", () => {
    // Arrange
    const input = { ...VALID, fatG: -1 };

    // Act
    const result = intakePresetRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an unknown field via strict mode", () => {
    // Arrange
    const input = { ...VALID, fiberG: 5 };

    // Act
    const result = intakePresetRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
