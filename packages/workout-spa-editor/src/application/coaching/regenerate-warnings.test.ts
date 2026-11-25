import { describe, expect, it } from "vitest";

import { coachWorkout } from "../session-move.test-fixtures";
import { regenerateWarnings } from "./regenerate-warnings";

const AI = {
  provider: "anthropic",
  model: "m",
  promptVersion: "1",
  processedAt: "2026-10-01T08:00:00.000Z",
};

describe("regenerateWarnings", () => {
  it("should ask nothing of an untouched Workout that is only Ready", () => {
    // Arrange
    const workout = coachWorkout({ aiMeta: AI, modifiedAt: null });

    // Act
    const warnings = regenerateWarnings(workout, false);

    // Assert
    expect(warnings).toEqual({ edited: false, onWatch: false });
  });

  it("should warn when the athlete edited the Workout after the AI built it", () => {
    // Arrange
    const workout = coachWorkout({
      aiMeta: AI,
      modifiedAt: "2026-10-02T08:00:00.000Z",
    });

    // Act
    const warnings = regenerateWarnings(workout, false);

    // Assert
    expect(warnings.edited).toBe(true);
  });

  it("should not count the AI's own write as a hand edit", () => {
    // Arrange
    const workout = coachWorkout({ aiMeta: AI, modifiedAt: AI.processedAt });

    // Act
    const warnings = regenerateWarnings(workout, false);

    // Assert
    expect(warnings.edited).toBe(false);
  });

  it("should warn when the Workout is on the watch", () => {
    // Arrange
    const pushed = coachWorkout({ state: "pushed", garminPushId: "g-1" });
    const placed = coachWorkout({ state: "ready" });

    // Act
    const fromState = regenerateWarnings(pushed, false);
    const fromPlacement = regenerateWarnings(placed, true);

    // Assert
    expect(fromState.onWatch).toBe(true);
    expect(fromPlacement.onWatch).toBe(true);
  });
});
