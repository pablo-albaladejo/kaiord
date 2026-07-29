/**
 * Helper for `undoDeleteAction`.
 */

import type { RepetitionBlock, WorkoutStep } from "../../types/krd";
import type { DeletedStep } from "../workout-store-state.types";

/**
 * Re-insert every item of a delete group at its original absolute
 * position.
 *
 * Ascending order is load-bearing: each stored `index` is a position in
 * the *pre-delete* list, so an earlier item must already be back before
 * a later one is placed. Restoring [1, 3] into [a, c, e] ascending gives
 * [a, b, c, e] then [a, b, c, d, e]; descending would land them wrong.
 */
export const restoreDeletedItems = (
  steps: ReadonlyArray<WorkoutStep | RepetitionBlock>,
  group: ReadonlyArray<DeletedStep>
): Array<WorkoutStep | RepetitionBlock> => {
  const restored = [...steps];
  [...group]
    .sort((a, b) => a.index - b.index)
    .forEach((entry) => {
      const at = Math.min(entry.index, restored.length);
      restored.splice(at, 0, entry.step as WorkoutStep | RepetitionBlock);
    });
  return restored;
};
