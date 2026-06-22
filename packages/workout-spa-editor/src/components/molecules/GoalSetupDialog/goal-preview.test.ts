import { describe, expect, it } from "vitest";

import type { GoalFormDraft } from "./goal-form-model";
import { previewGoal } from "./goal-preview";

const TODAY = "2026-06-21";
const MAINTENANCE_KCAL = 2400;

const aggressiveDraft: GoalFormDraft = {
  goalType: "fat_loss",
  startWeightKg: 70,
  targetWeightKg: 60,
  targetDate: "2026-07-21",
  overrideCap: false,
};

describe("previewGoal", () => {
  it("should compute a deficit delta and capped flag for an aggressive goal", () => {
    // Arrange
    const draft = aggressiveDraft;

    // Act
    const preview = previewGoal(draft, MAINTENANCE_KCAL, TODAY);

    // Assert
    expect(preview.dailyDeltaKcal).toBeLessThan(0);
    expect(preview.capped).toBe(true);
    expect(preview.overridden).toBe(false);
  });

  it("should return the raw unclamped delta but keep the flag when overridden", () => {
    // Arrange
    const clamped = previewGoal(aggressiveDraft, MAINTENANCE_KCAL, TODAY);

    // Act
    const overridden = previewGoal(
      { ...aggressiveDraft, overrideCap: true },
      MAINTENANCE_KCAL,
      TODAY
    );

    // Assert
    expect(overridden.capped).toBe(true);
    expect(overridden.overridden).toBe(true);
    expect(overridden.dailyDeltaKcal).toBeLessThan(clamped.dailyDeltaKcal);
  });
});
