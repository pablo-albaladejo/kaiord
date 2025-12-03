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

import type { KRD, Workout } from "../../types/krd";
import { isWorkoutStep } from "../../types/krd";
import { findBlockById } from "../utils/block-utils";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";

/**
 * Deletes a repetition block and all its contained steps.
 *
 * This action uses the block's unique ID to locate and remove it, ensuring the
 * correct block is deleted even if blocks have been reordered via drag-and-drop.
 *
 * ## Process
 *
 * 1. **Locate block**: Uses `findBlockById()` to find the block by its unique ID
 * 2. **Remove block**: Filters out the block from the workout steps
 * 3. **Reindex steps**: Recalculates stepIndex for all remaining WorkoutSteps
 * 4. **Clear selections**: Removes any selections referencing deleted steps
 * 5. **Update history**: Adds the deletion to undo history for restoration
 *
 * ## Why ID-Based Deletion?
 *
 * Previously, blocks were deleted by array index, which caused bugs when:
 * - Blocks were reordered via drag-and-drop (visual order ≠ data order)
 * - Multiple rapid operations occurred (race conditions)
 * - Undo/redo operations changed block positions
 *
 * Using unique IDs ensures the correct block is always deleted.
 *
 * ## Undo Support
 *
 * The deleted block is stored in the undo history with:
 * - The complete block data (including all steps)
 * - Its original position in the workout
 * - A timestamp for the deletion
 *
 * This allows perfect restoration via Ctrl+Z / Cmd+Z.
 *
 * @param krd - The current KRD workout data
 * @param blockId - The unique ID of the block to delete
 * @param state - The current workout state
 * @returns Partial state update with modified workout and cleared selections
 *
 * @example
 * ```typescript
 * // Delete a block by its ID
 * const newState = deleteRepetitionBlockAction(
 *   currentKrd,
 *   "block-1704123456789-x7k2m9p4q",
 *   currentState
 * );
 *
 * // The correct block is deleted, regardless of its position
 * // All remaining steps are reindexed sequentially
 * // Selections are cleared if they referenced deleted steps
 * ```
 */
export const deleteRepetitionBlockAction = (
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

  // Remove block and reindex steps
  const newSteps = workout.steps.filter((_, index) => index !== position);
  let currentIndex = 0;
  const reindexedSteps = newSteps.map((step) => {
    if (isWorkoutStep(step)) {
      return { ...step, stepIndex: currentIndex++ };
    }
    return step;
  });

  const updatedKrd: KRD = {
    ...krd,
    extensions: {
      ...krd.extensions,
      workout: { ...workout, steps: reindexedSteps },
    },
  };

  // Track deleted block for undo
  const deletedBlocks = state.deletedSteps || [];
  const newDeletedBlocks = [
    ...deletedBlocks,
    { step: block, index: position, timestamp: Date.now() },
  ];

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    selectedStepId: null,
    selectedStepIds: [],
    deletedSteps: newDeletedBlocks,
  };
};
