/**
 * Add Step to Repetition Block Action
 *
 * Action for adding a step to a repetition block.
 *
 * Requirements:
 * - Requirement 4: Create repetition blocks from selected steps
 * - Requirement 2.4: Use block ID for operations
 */

import type { KRD, RepetitionBlock } from "../../types/krd";
import { createdItemTarget } from "../focus-rules";
import { defaultIdProvider } from "../providers/id-provider";
import { findBlockById } from "../utils/block-utils";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import {
  buildKrdWithWorkout,
  extractStructuredWorkout,
  replaceBlockAtPosition,
} from "./_helpers";

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
  const workout = extractStructuredWorkout(krd);
  if (!workout) return {};

  const blockInfo = findBlockById(workout, blockId);
  if (!blockInfo) return {};

  const { block, position } = blockInfo;

  // Create a new default step
  const newStepIndex = block.steps.length;
  const newStep = {
    id: defaultIdProvider(),
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

  const updatedWorkout = replaceBlockAtPosition(
    workout,
    position,
    updatedBlock
  );
  const updatedKrd: KRD = buildKrdWithWorkout(krd, updatedWorkout);

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    pendingFocusTarget: createdItemTarget(newStep.id),
  };
};
