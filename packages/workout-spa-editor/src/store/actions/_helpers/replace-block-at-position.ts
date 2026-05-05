/**
 * Replaces a single block at a given top-level position in the
 * workout's steps array, returning a new Workout. Used by actions that
 * mutate one repetition block in place (add-step, edit-repeat-count)
 * without changing surrounding step order or top-level indices.
 */

import type { RepetitionBlock, Workout } from "../../../types/krd";

export const replaceBlockAtPosition = (
  workout: Workout,
  position: number,
  block: RepetitionBlock
): Workout => {
  const updatedSteps = [...workout.steps];
  updatedSteps[position] = block;
  return { ...workout, steps: updatedSteps };
};
