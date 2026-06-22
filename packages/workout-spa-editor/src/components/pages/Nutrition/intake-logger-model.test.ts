import { describe, expect, it } from "vitest";

import { EMPTY_INTAKE_FIELDS, validateIntakeForm } from "./intake-logger-model";

describe("validateIntakeForm", () => {
  it("should reject empty energy with a prompt to enter kcal", () => {
    // Arrange
    const fields = { ...EMPTY_INTAKE_FIELDS, proteinG: "10" };

    // Act
    const result = validateIntakeForm(fields);

    // Assert
    expect(result).toEqual({ error: "Enter the energy in kcal" });
  });

  it("should reject a negative macro value", () => {
    // Arrange
    const fields = { ...EMPTY_INTAKE_FIELDS, kcal: "600", proteinG: "-5" };

    // Act
    const result = validateIntakeForm(fields);

    // Assert
    expect(result).toEqual({ error: "Values must be zero or greater" });
  });

  it("should parse a valid entry with macros and a meal slot", () => {
    // Arrange
    const fields = {
      kcal: "600",
      proteinG: "40",
      carbG: "60",
      fatG: "20",
      label: "Lunch bowl",
      mealSlot: "lunch" as const,
    };

    // Act
    const result = validateIntakeForm(fields);

    // Assert
    expect(result).toEqual({
      entry: {
        kcal: 600,
        proteinG: 40,
        carbG: 60,
        fatG: 20,
        label: "Lunch bowl",
        mealSlot: "lunch",
      },
    });
  });

  it("should default blank macros to zero and omit an empty label and slot", () => {
    // Arrange
    const fields = { ...EMPTY_INTAKE_FIELDS, kcal: "250" };

    // Act
    const result = validateIntakeForm(fields);

    // Assert
    expect(result).toEqual({
      entry: {
        kcal: 250,
        proteinG: 0,
        carbG: 0,
        fatG: 0,
        label: undefined,
        mealSlot: undefined,
      },
    });
  });
});
