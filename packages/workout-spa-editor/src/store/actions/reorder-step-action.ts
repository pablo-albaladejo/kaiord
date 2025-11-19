/**
 * Reorder Step Action
 *
 * Action for reordering workout steps by moving a step from one position to another.
 * Requirement 3: Update step indices and reorder workout structure
 */

import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import { isWorkoutStep } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

/**
 * Validates indices for step reordering
 */
const validateIndices = (
  activeIndex: number,
  overIndex: number,
  stepsLength: number
): boolean => {
  return (
    activeIndex >= 0 &&
    activeIndex < stepsLength &&
    overIndex >= 0 &&
    overIndex < stepsLength
  );
};

/**
 * Reindexes workout steps after reordering
 */
const reindexSteps = (
  steps: Array<WorkoutStep | RepetitionBlock>
): Array<WorkoutStep | RepetitionBlock> => {
  return steps.map((step, index) => {
    if (isWorkoutStep(step)) {
      return { ...step, stepIndex: index };
    }
    return step;
  });
};

/**
 * Reorders steps in the workout by moving a step from activeIndex to overIndex
 * @param krd - Current KRD workout
 * @param activeIndex - Index of the step being moved
 * @param overIndex - Index where the step should be moved to
 * @param state - Current workout state
 * @returns Updated workout state with reordered steps
 */
export const reorderStepAction = (
  krd: KRD,
  activeIndex: number,
  overIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  console.log("🔄 reorderStepAction called", {
    activeIndex,
    overIndex,
    hasWorkout: !!krd.extensions?.workout,
  });

  if (!krd.extensions?.workout || activeIndex === overIndex) {
    console.log("❌ No workout or same index");
    return {};
  }

  const workout = krd.extensions.workout as Workout;
  const steps = [...workout.steps];

  if (!validateIndices(activeIndex, overIndex, steps.length)) {
    console.log("❌ Indices out of bounds");
    return {};
  }

  const [movedStep] = steps.splice(activeIndex, 1);
  steps.splice(overIndex, 0, movedStep);

  const updatedKrd: KRD = {
    ...krd,
    extensions: {
      ...krd.extensions,
      workout: {
        ...workout,
        steps: reindexSteps(steps),
      },
    },
  };

  console.log("✅ Calling createUpdateWorkoutAction");
  const result = createUpdateWorkoutAction(updatedKrd, state);
  const resultState = result as WorkoutState;
  const resultWorkout = resultState.currentWorkout?.extensions?.workout as
    | Workout
    | undefined;
  console.log("📦 Result from createUpdateWorkoutAction:", {
    hasCurrentWorkout: !!resultState.currentWorkout,
    historyLength: resultState.workoutHistory?.length,
    historyIndex: resultState.historyIndex,
    stepsInWorkout: resultWorkout?.steps?.length,
  });
  return result;
};
