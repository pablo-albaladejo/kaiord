/**
 * Workout Migration Utilities
 *
 * Functions for migrating workout data structures to support new features.
 */

import type { Workout } from "../types/krd";
import { isRepetitionBlock } from "../types/krd-guards";
import { generateBlockId } from "./id-generation";

/**
 * Migrates repetition blocks in a workout to ensure all blocks have unique IDs.
 *
 * This function:
 * - Adds IDs to blocks that don't have them
 * - Preserves existing IDs if present
 * - Returns a new workout object (does not mutate the original)
 *
 * @param workout - The workout to migrate
 * @returns A new workout with all repetition blocks having IDs
 *
 * @example
 * ```typescript
 * const workout = {
 *   sport: "running",
 *   steps: [
 *     { repeatCount: 3, steps: [...] } // No ID
 *   ]
 * };
 *
 * const migrated = migrateRepetitionBlocks(workout);
 * // migrated.steps[0].id => "block-1704123456789-x7k2m9p4q"
 * ```
 */
export const migrateRepetitionBlocks = (workout: Workout): Workout => {
  // Return new workout with migrated steps
  return {
    ...workout,
    steps: workout.steps.map((step) => {
      // Only process repetition blocks
      if (!isRepetitionBlock(step)) {
        return step;
      }

      // If block already has an ID, preserve it
      if (step.id) {
        return step;
      }

      // Add a new ID to blocks without one
      return {
        ...step,
        id: generateBlockId(),
      };
    }),
  };
};
