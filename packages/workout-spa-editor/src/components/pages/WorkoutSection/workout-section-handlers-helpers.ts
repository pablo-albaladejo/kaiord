import { isRepetitionBlock } from "../../../types/krd";
import { parseStepId } from "../../../utils/step-id-parser";
import type { KRD, Workout, WorkoutStep } from "../../../types/krd";

export function createUpdatedWorkout(
  workout: Workout,
  updatedStep: WorkoutStep,
  selectedStepId: string | null
): Workout {
  if (!selectedStepId) {
    // No selection - shouldn't happen, but return unchanged workout
    return workout;
  }

  try {
    const parsed = parseStepId(selectedStepId);

    // Only handle step IDs, not block IDs
    if (parsed.type !== "step" || parsed.stepIndex === undefined) {
      return workout;
    }

    // If blockIndex is present, update step in that specific block
    if (parsed.blockIndex !== undefined) {
      return {
        ...workout,
        steps: workout.steps.map((item, itemIndex) => {
          if (isRepetitionBlock(item) && itemIndex === parsed.blockIndex) {
            // This is the target block - update the step
            return {
              ...item,
              steps: item.steps.map((s) =>
                s.stepIndex === parsed.stepIndex ? updatedStep : s
              ),
            };
          }
          return item;
        }),
      };
    }

    // No blockIndex: update step in main workout only
    return {
      ...workout,
      steps: workout.steps.map((item) => {
        if (!isRepetitionBlock(item) && item.stepIndex === parsed.stepIndex) {
          return updatedStep;
        }
        return item;
      }),
    };
  } catch {
    // Invalid ID format - return unchanged workout
    return workout;
  }
}

export function createUpdatedKrd(krd: KRD, updatedWorkout: Workout): KRD {
  return {
    ...krd,
    extensions: {
      ...krd.extensions,
      structured_workout: updatedWorkout,
    },
  };
}
