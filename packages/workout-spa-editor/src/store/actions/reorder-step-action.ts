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
import { createdItemTarget } from "../focus-rules";
import type { ItemId } from "../providers/item-id";
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
 * NOTE: We do NOT update stepIndex during reorder to maintain stable React keys
 * The stepIndex will be updated on the next save/export operation
 */
const reindexSteps = (
  steps: Array<WorkoutStep | RepetitionBlock>
): Array<WorkoutStep | RepetitionBlock> => {
  // Return steps as-is without reindexing
  // This preserves the original stepIndex values which are used for React keys
  return steps;
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
  if (!krd.extensions?.structured_workout || activeIndex === overIndex) {
    return {};
  }

  const workout = krd.extensions.structured_workout as Workout;
  const steps = [...workout.steps];

  if (!validateIndices(activeIndex, overIndex, steps.length)) {
    return {};
  }

  const [movedStep] = steps.splice(activeIndex, 1);
  steps.splice(overIndex, 0, movedStep);

  const reindexedSteps = reindexSteps(steps);

  const updatedKrd: KRD = {
    ...krd,
    extensions: {
      ...krd.extensions,
      structured_workout: {
        ...workout,
        steps: reindexedSteps,
      },
    },
  };

  // Focus follows the moved item to its new position. Its id is stable
  // across the reorder (ItemId doesn't change on array moves), so the
  // hook re-resolves the same item and scrolls to its new DOM node.
  const movedId = (movedStep as { id?: string }).id;
  const pendingFocusTarget = movedId
    ? createdItemTarget(movedId as ItemId)
    : state.pendingFocusTarget;

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    pendingFocusTarget,
  };
};
