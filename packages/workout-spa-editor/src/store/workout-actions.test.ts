/**
 * Workout Actions — createEmptyWorkoutAction tests.
 *
 * Focused on the invariants that matter for the focus-management
 * foundations PR: every empty workout is a fresh UIWorkout (zero steps,
 * no ids to leak) and BOTH selection slots (`selectedStepId` + the new
 * `selectedStepIds` multi-selection) are reset so a prior selection
 * cannot survive into the new workout.
 */

import { describe, expect, it } from "vitest";

import { createEmptyWorkoutAction } from "./workout-actions";

describe("createEmptyWorkoutAction", () => {
  it("should build an empty UIWorkout with a single-snapshot history", () => {
    // Arrange
    const patch = createEmptyWorkoutAction("New ride", "cycling");
    expect(patch.currentWorkout).toBeDefined();

    // Act
    const inner = patch.currentWorkout?.extensions?.structured_workout;

    // Assert
    expect(inner).toEqual({ name: "New ride", sport: "cycling", steps: [] });
    expect(patch.undoHistory).toHaveLength(1);
    expect(patch.historyIndex).toBe(0);
    expect(patch.isEditing).toBe(false);
  });

  it("should clear both single- and multi-selection slots", () => {
    // Arrange

    // Act
    const patch = createEmptyWorkoutAction("New ride", "cycling");

    // Assert
    expect(patch.selectedStepId).toBeNull();
    expect(patch.selectedStepIds).toEqual([]);
  });
});
