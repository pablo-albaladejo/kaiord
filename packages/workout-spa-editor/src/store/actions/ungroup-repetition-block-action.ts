/**
 * Ungroup Repetition Block Action
 *
 * Action for extracting steps from a repetition block back into individual steps.
 *
 * Requirements:
 * - Requirement 7.4: Ungroup repetition blocks
 * - Requirement 2.4: Use block ID for operations
 */

import type { KRD } from "../../types/krd";
import { createdItemTarget } from "../focus-rules";
import type { ItemId } from "../providers/item-id";
import { findBlockById } from "../utils/block-utils";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import { buildKrdWithWorkout, extractStructuredWorkout } from "./_helpers";
import { recalculateStepIndices } from "./recalculate-step-indices";

/**
 * Ungroups a repetition block by its ID, extracting its steps back into the workout
 *
 * @param krd - Current KRD workout
 * @param blockId - Unique ID of the repetition block to ungroup
 * @param state - Current workout state
 * @returns Updated workout state
 */
export const ungroupRepetitionBlockAction = (
  krd: KRD,
  blockId: string,
  state: WorkoutState
): Partial<WorkoutState> => {
  const workout = extractStructuredWorkout(krd);
  if (!workout) return {};

  const blockInfo = findBlockById(workout, blockId);
  if (!blockInfo) return {};

  const { block, position } = blockInfo;

  // Extract steps from the block, splice them in at the block's slot,
  // then rebuild contiguous top-level stepIndex values.
  const extractedSteps = block.steps;
  const newSteps = [
    ...workout.steps.slice(0, position),
    ...extractedSteps,
    ...workout.steps.slice(position + 1),
  ];
  const reindexedSteps = recalculateStepIndices(newSteps);

  const updatedKrd: KRD = buildKrdWithWorkout(krd, {
    ...workout,
    steps: reindexedSteps,
  });

  // Focus lands on the first formerly-child step at its new top-level
  // position (the same `position` the block occupied). Falls back to
  // the existing focus target if the block had no steps (shouldn't
  // happen — empty blocks cascade-delete before they can be ungrouped).
  const firstChildId = (extractedSteps[0] as { id?: string } | undefined)?.id;
  const pendingFocusTarget = firstChildId
    ? createdItemTarget(firstChildId as ItemId)
    : state.pendingFocusTarget;

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    pendingFocusTarget,
  };
};
