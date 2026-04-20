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
  it("builds an empty UIWorkout with a single-snapshot history", () => {
    const patch = createEmptyWorkoutAction("New ride", "cycling");

    expect(patch.currentWorkout).toBeDefined();
    const inner = patch.currentWorkout?.extensions?.structured_workout;
    expect(inner).toEqual({ name: "New ride", sport: "cycling", steps: [] });
    expect(patch.workoutHistory).toHaveLength(1);
    expect(patch.historyIndex).toBe(0);
    expect(patch.isEditing).toBe(false);
  });

  it("clears both single- and multi-selection slots", () => {
    const patch = createEmptyWorkoutAction("New ride", "cycling");

    expect(patch.selectedStepId).toBeNull();
    expect(patch.selectedStepIds).toEqual([]);
  });
});
