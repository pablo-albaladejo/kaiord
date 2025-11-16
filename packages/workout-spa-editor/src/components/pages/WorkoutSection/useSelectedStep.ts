import { useMemo } from "react";
import type { Workout, WorkoutStep } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd";

export const useSelectedStep = (
  selectedStepId: string | null,
  workout: Workout
): WorkoutStep | null => {
  return useMemo(() => {
    if (!selectedStepId) return null;

    const stepIndex = Number.parseInt(selectedStepId.replace("step-", ""), 10);
    if (Number.isNaN(stepIndex)) return null;

    for (const item of workout.steps) {
      if (isRepetitionBlock(item)) {
        const step = item.steps.find((s) => s.stepIndex === stepIndex);
        if (step) return step;
      } else if (item.stepIndex === stepIndex) {
        return item;
      }
    }

    return null;
  }, [selectedStepId, workout.steps]);
};
