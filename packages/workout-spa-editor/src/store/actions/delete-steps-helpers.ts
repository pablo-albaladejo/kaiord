/**
 * Helpers for `deleteStepsAction` — the bulk (multi-selection) delete.
 *
 * The whole point of this module is that the removal happens in ONE
 * pass: filter once, reindex once. Looping the singular delete would
 * reindex between iterations and remove the wrong steps from the second
 * iteration onward.
 */

import type { RepetitionBlock, Workout, WorkoutStep } from "../../types/krd";
import { isWorkoutStep } from "../../types/krd";
import type { FoundStep } from "./delete-step-helpers";

/**
 * Resolve the requested `stepIndex` values to the steps they address,
 * paired with their flat array positions. Unmatched indices are dropped.
 * Result is sorted by array position so undo can re-insert ascending.
 */
export const findStepsToDelete = (
  workout: Workout,
  stepIndices: ReadonlyArray<number>
): Array<FoundStep> => {
  const wanted = new Set(stepIndices);
  const found: Array<FoundStep> = [];
  workout.steps.forEach((step, arrayIndex) => {
    if (isWorkoutStep(step) && wanted.has(step.stepIndex)) {
      found.push({ step, arrayIndex });
    }
  });
  return found;
};

/** Remove every addressed step in a single pass. */
export const filterOutSteps = (
  steps: ReadonlyArray<WorkoutStep | RepetitionBlock>,
  stepIndices: ReadonlyArray<number>
): Array<WorkoutStep | RepetitionBlock> => {
  const wanted = new Set(stepIndices);
  return steps.filter((step) =>
    isWorkoutStep(step) ? !wanted.has(step.stepIndex) : true
  );
};
