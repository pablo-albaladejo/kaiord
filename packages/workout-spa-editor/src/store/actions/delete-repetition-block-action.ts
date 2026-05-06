/**
 * Delete Repetition Block Action
 *
 * Action for deleting an entire repetition block and all its contained steps.
 *
 * Requirements:
 * - Remove the entire block and all its steps from the workout
 * - Recalculate stepIndex for all remaining steps
 * - Add deletion to undo history
 * - Clear selections that reference deleted block steps
 * - Update workout statistics after deletion
 */

import type { KRD } from "../../types/krd";
import { isWorkoutStep } from "../../types/krd";
import type { UIWorkoutItem } from "../../types/krd-ui";
import { nextAfterDelete } from "../focus-rules";
import { findBlockById } from "../utils/block-utils";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import { buildKrdWithWorkout, extractStructuredWorkout } from "./_helpers";

/**
 * Deletes a repetition block and all its contained steps.
 *
 * Locates the block by its unique ID (so drag-reorders, undo/redo and
 * concurrent operations cannot misalign the index), removes it,
 * reindexes the surviving top-level steps, records the deletion in
 * undo history, and clears any selections that referenced the deleted
 * subtree.
 *
 * @param krd - The current KRD workout data
 * @param blockId - The unique ID of the block to delete
 * @param state - The current workout state
 * @returns Partial state update with modified workout and cleared selections
 */
export const deleteRepetitionBlockAction = (
  krd: KRD,
  blockId: string,
  state: WorkoutState
): Partial<WorkoutState> => {
  const workout = extractStructuredWorkout(krd);
  if (!workout) return {};

  const blockInfo = findBlockById(workout, blockId);
  if (!blockInfo) return {};

  const { block, position } = blockInfo;

  // Remove block and reindex steps
  const newSteps = workout.steps.filter((_, index) => index !== position);
  let currentIndex = 0;
  const reindexedSteps = newSteps.map((step) => {
    if (isWorkoutStep(step)) {
      return { ...step, stepIndex: currentIndex++ };
    }
    return step;
  });

  const updatedKrd: KRD = buildKrdWithWorkout(krd, {
    ...workout,
    steps: reindexedSteps,
  });

  // Track deleted block for undo. The block came from the in-memory
  // UIWorkout, so it carries a stable ItemId at runtime; re-assert the
  // type after the Workout cast erased it.
  const deletedBlocks = state.deletedSteps || [];
  const newDeletedBlocks = [
    ...deletedBlocks,
    {
      step: block as UIWorkoutItem,
      index: position,
      timestamp: Date.now(),
    },
  ];

  // Focus intent: the block took a main-list slot, so the same
  // nextAfterDelete rule applies — next sibling in the main list,
  // previous sibling, or empty-state.
  const pendingFocusTarget = nextAfterDelete({
    workout: { ...workout, steps: reindexedSteps },
    deletedIndex: position,
  });

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    selectedStepId: null,
    selectedStepIds: [],
    deletedSteps: newDeletedBlocks,
    pendingFocusTarget,
  };
};
