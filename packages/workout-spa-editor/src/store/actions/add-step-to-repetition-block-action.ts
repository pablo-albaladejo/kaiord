/**
 * Add Step to Repetition Block Action
 *
 * Action for adding a step to a repetition block.
 *
 * Requirements:
 * - Requirement 4: Create repetition blocks from selected steps
 * - Requirement 2.4: Use block ID for operations
 */

import type { KRD, RepetitionBlock, Workout } from "../../types/krd";
import { findBlockById } from "../utils/block-utils";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

/**
 * Adds a new step to a repetition block by its ID
 *
 * @param krd - Current KRD workout
 * @param blockId - Unique ID of the repetition block
 * @param state - Current workout state
 * @returns Updated workout state
 */
export const addStepToRepetitionBlockAction = (
  krd: KRD,
  blockId: string,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  const workout = krd.extensions.workout as Workout;

  // Find block by ID
  const blockInfo = findBlockById(workout, blockId);

  if (!blockInfo) {
    return {};
  }

  const { block, position } = blockInfo;

  // Create a new default step
  const newStepIndex = block.steps.length;
  const newStep = {
    stepIndex: newStepIndex,
    name: `Step ${newStepIndex + 1}`,
    durationType: "time" as const,
    duration: { type: "time" as const, seconds: 300 },
    targetType: "power" as const,
    target: {
      type: "power" as const,
      value: { unit: "watts" as const, value: 200 },
    },
    intensity: "active" as const,
  };

  const updatedBlock: RepetitionBlock = {
    ...block,
    steps: [...block.steps, newStep],
  };

  const updatedSteps = [...workout.steps];
  updatedSteps[position] = updatedBlock;

  const updatedWorkout: Workout = {
    ...workout,
    steps: updatedSteps,
  };

  const updatedKrd: KRD = {
    ...krd,
    extensions: {
      ...krd.extensions,
      workout: updatedWorkout,
    },
  };

  return createUpdateWorkoutAction(updatedKrd, state);
};
