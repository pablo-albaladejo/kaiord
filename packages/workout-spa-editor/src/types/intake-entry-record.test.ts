import { describe, expect, it } from "vitest";

import { intakeEntryRecordSchema } from "./intake-entry-record";

const VALID = {
  id: "i-1",
  profileId: "p-1",
  date: "2026-06-21",
  loggedAt: "2026-06-21T08:00:00.000Z",
  updatedAt: "2026-06-21T08:00:00.000Z",
  label: "Lunch",
  mealSlot: "lunch" as const,
  kcal: 600,
  proteinG: 40,
  carbG: 60,
  fatG: 20,
};

describe("intakeEntryRecordSchema", () => {
  it("should accept a fully-populated intake entry", () => {
    // Arrange
    const input = VALID;

    // Act
    const result = intakeEntryRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept an entry without optional label or meal slot", () => {
    // Arrange
    const input = {
      id: VALID.id,
      profileId: VALID.profileId,
      date: VALID.date,
      loggedAt: VALID.loggedAt,
      updatedAt: VALID.updatedAt,
      kcal: VALID.kcal,
      proteinG: VALID.proteinG,
      carbG: VALID.carbG,
      fatG: VALID.fatG,
    };

    // Act
    const result = intakeEntryRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject an entry without the updatedAt sync clock", () => {
    // Arrange
    const input: Record<string, unknown> = { ...VALID };
    delete input.updatedAt;

    // Act
    const result = intakeEntryRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a negative kcal value", () => {
    // Arrange
    const input = { ...VALID, kcal: -1 };

    // Act
    const result = intakeEntryRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a negative macro value", () => {
    // Arrange
    const input = { ...VALID, proteinG: -5 };

    // Act
    const result = intakeEntryRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an invalid meal slot", () => {
    // Arrange
    const input = { ...VALID, mealSlot: "brunch" };

    // Act
    const result = intakeEntryRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a malformed date string", () => {
    // Arrange
    const input = { ...VALID, date: "2026-6-1" };

    // Act
    const result = intakeEntryRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an unknown field via strict mode", () => {
    // Arrange
    const input = { ...VALID, sodiumMg: 10 };

    // Act
    const result = intakeEntryRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
