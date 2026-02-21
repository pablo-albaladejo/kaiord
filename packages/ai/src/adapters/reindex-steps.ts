import type { Workout } from "@kaiord/core";
import { isRepetitionBlock } from "@kaiord/core";

/**
 * Re-indexes stepIndex fields sequentially (0, 1, 2, ...)
 * in both top-level steps and nested repetition block steps.
 * Returns a shallow copy with corrected indices.
 */
export const reindexSteps = (workout: Workout): Workout => ({
  ...workout,
  steps: workout.steps.map((step, i) => {
    if (isRepetitionBlock(step)) {
      return {
        ...step,
        steps: step.steps.map((inner, j) => ({
          ...inner,
          stepIndex: j,
        })),
      };
    }
    return { ...step, stepIndex: i };
  }),
});
