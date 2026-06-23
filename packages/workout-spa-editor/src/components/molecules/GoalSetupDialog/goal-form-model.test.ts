import { describe, expect, it } from "vitest";

import { type GoalFormFields, validateGoalForm } from "./goal-form-model";

const TODAY = "2026-06-21";
const START_WEIGHT_KG = 70;

const baseFields: GoalFormFields = {
  goalType: "fat_loss",
  startWeightKg: "70",
  targetWeightKg: "67",
  targetDate: "2026-12-21",
  overrideCap: false,
};

describe("validateGoalForm", () => {
  it("should accept a well-formed future-dated goal", () => {
    // Arrange
    const fields = baseFields;

    // Act
    const result = validateGoalForm(fields, TODAY);

    // Assert
    expect("draft" in result).toBe(true);
    if (!("draft" in result)) return;
    expect(result.draft.startWeightKg).toBe(START_WEIGHT_KG);
  });

  it("should reject a non-future target date", () => {
    // Arrange
    const fields: GoalFormFields = { ...baseFields, targetDate: TODAY };

    // Act
    const result = validateGoalForm(fields, TODAY);

    // Assert
    expect("error" in result).toBe(true);
  });

  it("should reject a non-positive start weight", () => {
    // Arrange
    const fields: GoalFormFields = { ...baseFields, startWeightKg: "0" };

    // Act
    const result = validateGoalForm(fields, TODAY);

    // Assert
    expect("error" in result).toBe(true);
  });

  it("should carry the overrideCap flag onto the parsed draft", () => {
    // Arrange
    const fields: GoalFormFields = { ...baseFields, overrideCap: true };

    // Act
    const result = validateGoalForm(fields, TODAY);

    // Assert
    expect("draft" in result).toBe(true);
    if (!("draft" in result)) return;
    expect(result.draft.overrideCap).toBe(true);
  });
});
