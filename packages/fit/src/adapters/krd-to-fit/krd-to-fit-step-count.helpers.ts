import type { RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { isRepetitionBlock } from "@kaiord/core";

/**
 * Counts the number of FIT-valid workout steps from a list of KRD steps.
 *
 * Each repetition block expands to its inner steps (recursively, since
 * inner steps may themselves be repetition blocks) plus one synthetic
 * repeat step in the FIT message stream.
 */
export const countValidSteps = (
  steps: Array<WorkoutStep | RepetitionBlock>
): number => {
  let count = 0;
  for (const step of steps) {
    if (isRepetitionBlock(step)) {
      count += countValidSteps(step.steps) + 1;
    } else {
      count += 1;
    }
  }
  return count;
};
