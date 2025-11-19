/**
 * Add Step to Repetition Block Action
 *
 * Action for adding a step to a repetition block.
 *
 * Requirements:
 * - Requirement 4: Create repetition blocks from selected steps
 */

import type { KRD, RepetitionBlock, Workout } from "../../types/krd";
import { isRepetitionBlock } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

/**
 * Adds a new step to a repetition block at the given index
 *
 * @param krd - Current KRD workout
 * @param blockIndex - Index of the repetition block in the workout steps array
 * @param state - Current workout state
 * @returns Updated workout state
 */
export const addStepToRepetitionBlockAction = (
  krd: KRD,
  blockIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  const workout = krd.extensions.workout as Workout;

  if (blockIndex < 0 || blockIndex >= workout.steps.length) {
    return {};
  }

  const block = workout.steps[blockIndex];
  if (!isRepetitionBlock(block)) {
    return {};
  }

  // Create a new default step
  const newStepIndex = block.steps.length;
  const newStep = {
    stepIndex: newStepIndex,
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
  updatedSteps[blockIndex] = updatedBlock;

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
