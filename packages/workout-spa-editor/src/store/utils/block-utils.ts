/**
 * Block Utilities
 *
 * Shared utility functions for working with repetition blocks.
 */

import { isRepetitionBlock } from "../../types/krd";
import type { RepetitionBlock, Workout } from "../../types/krd";

/**
 * Finds a repetition block by its unique ID.
 *
 * This function searches through the workout's steps to locate a repetition block
 * with the specified ID. It returns both the block and its position in the steps array.
 *
 * ## Performance
 *
 * - Time complexity: O(n) where n is the number of steps in the workout
 * - Typical workouts have < 50 steps, so performance is excellent
 * - Early return when block is found
 *
 * ## Use Cases
 *
 * - Block deletion: Locate block before removing it
 * - Block editing: Find block to update its properties
 * - Block ungrouping: Locate block to convert to individual steps
 *
 * @param workout - The workout to search
 * @param blockId - The unique ID of the block to find
 * @returns Object with block and position, or null if not found
 *
 * @example
 * ```typescript
 * const result = findBlockById(workout, "block-1704123456789-x7k2m9p4q");
 * if (result) {
 *   console.log(`Found block at position ${result.position}`);
 *   console.log(`Block has ${result.block.steps.length} steps`);
 * }
 * ```
 */
export const findBlockById = (
  workout: Workout,
  blockId: string
): { block: RepetitionBlock; position: number } | null => {
  for (let i = 0; i < workout.steps.length; i++) {
    const step = workout.steps[i];
    if (isRepetitionBlock(step) && step.id === blockId) {
      return { block: step, position: i };
    }
  }

  return null;
};
