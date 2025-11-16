import type { KRD, Workout, WorkoutStep } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd";

export function createUpdatedWorkout(
  workout: Workout,
  updatedStep: WorkoutStep
): Workout {
  return {
    ...workout,
    steps: workout.steps.map((item) => {
      if (isRepetitionBlock(item)) {
        return {
          ...item,
          steps: item.steps.map((s) =>
            s.stepIndex === updatedStep.stepIndex ? updatedStep : s
          ),
        };
      }
      return item.stepIndex === updatedStep.stepIndex ? updatedStep : item;
    }),
  };
}

export function createUpdatedKrd(krd: KRD, updatedWorkout: Workout): KRD {
  return {
    ...krd,
    extensions: {
      ...krd.extensions,
      workout: updatedWorkout,
    },
  };
}
