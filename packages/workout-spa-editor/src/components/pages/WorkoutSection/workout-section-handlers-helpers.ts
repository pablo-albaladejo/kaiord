import { findById } from "../../../store/find-by-id";
import type { KRD, Workout, WorkoutStep } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd";

export function createUpdatedWorkout(
  workout: Workout,
  updatedStep: WorkoutStep,
  selectedStepId: string | null
): Workout {
  if (!selectedStepId) {
    // No selection - shouldn't happen, but return unchanged workout
    return workout;
  }

  const found = findById(workout, selectedStepId);
  if (!found) return workout;

  if (found.kind === "nested-step") {
    const { blockIndex, stepIndex } = found;
    return {
      ...workout,
      steps: workout.steps.map((item, itemIndex) => {
        if (isRepetitionBlock(item) && itemIndex === blockIndex) {
          return {
            ...item,
            steps: item.steps.map((s, j) => {
              if (j !== stepIndex) return s;
              const nestedId = (s as { id?: string }).id;
              return { ...updatedStep, ...(nestedId ? { id: nestedId } : {}) };
            }),
          };
        }
        return item;
      }),
    };
  }

  if (found.kind === "step") {
    const { index } = found;
    return {
      ...workout,
      steps: workout.steps.map((item, itemIndex) => {
        if (itemIndex === index && !isRepetitionBlock(item)) {
          const topId = (item as { id?: string }).id;
          return { ...updatedStep, ...(topId ? { id: topId } : {}) };
        }
        return item;
      }),
    };
  }

  // Blocks are not editable through this path.
  return workout;
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
