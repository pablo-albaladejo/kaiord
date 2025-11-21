import { useMemo } from "react";
import type { Workout, WorkoutStep } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd";
import { parseStepId } from "../../../utils/step-id-parser";

export const useSelectedStep = (
  selectedStepId: string | null,
  workout: Workout
): WorkoutStep | null => {
  return useMemo(() => {
    if (!selectedStepId) return null;

    try {
      const parsed = parseStepId(selectedStepId);

      // Only handle step IDs, not block IDs
      if (parsed.type !== "step" || parsed.stepIndex === undefined) {
        return null;
      }

      // If blockIndex is present, search in that specific block
      if (parsed.blockIndex !== undefined) {
        let currentBlockIndex = 0;
        for (const item of workout.steps) {
          if (isRepetitionBlock(item)) {
            if (currentBlockIndex === parsed.blockIndex) {
              const step = item.steps.find(
                (s) => s.stepIndex === parsed.stepIndex
              );
              if (step) return step;
            }
            currentBlockIndex++;
          }
        }
        return null;
      }

      // No blockIndex: search in main workout steps only
      for (const item of workout.steps) {
        if (!isRepetitionBlock(item) && item.stepIndex === parsed.stepIndex) {
          return item;
        }
      }

      return null;
    } catch (error) {
      // Invalid ID format - return null
      console.warn("Invalid step ID format", { selectedStepId, error });
      return null;
    }
  }, [selectedStepId, workout.steps]);
};
