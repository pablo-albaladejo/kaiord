/**
 * Rule: focus the "next logical item" after a multi-select delete.
 *
 * Branches (from the proposal Goals section):
 *   - First remaining item after the last-deleted position, if any.
 *   - Otherwise previous-sibling rule applied to the first-deleted
 *     position (i.e. the item now sitting just before the earliest
 *     original deletion).
 *   - Empty list → main-list empty-state.
 *
 * Non-contiguous selections are handled by "last-deleted / first-deleted"
 * referring to the max / min of the original positions regardless of
 * gaps between them.
 *
 * Purity: no React, no DOM, no store reads.
 */

import type { Workout } from "../../types/krd";
import type { FocusTarget } from "../focus/focus-target.types";
import { focusEmptyState, focusItem } from "../focus/focus-target.types";
import type { ItemId } from "../providers/item-id";

type NextAfterMultiDeleteInput = {
  workout: Workout | undefined;
  /**
   * Flat indices the deleted items occupied before the mutation. Need
   * not be sorted or contiguous. Empty → empty-state.
   */
  deletedIndices: ReadonlyArray<number>;
};

export const nextAfterMultiDelete = (
  input: NextAfterMultiDeleteInput
): FocusTarget => {
  const { workout, deletedIndices } = input;
  if (!workout) return focusEmptyState;

  const steps = workout.steps;
  if (steps.length === 0 || deletedIndices.length === 0) {
    return focusEmptyState;
  }

  const indices = [...deletedIndices].sort((a, b) => a - b);
  const firstDeleted = indices[0];
  const lastDeleted = indices[indices.length - 1];
  const removedCount = indices.length;

  // The "first remaining item after the last-deleted original position"
  // sits at `lastDeleted - (removedCount - 1)` in the post-delete list,
  // because every earlier deletion shifted things left by one.
  const afterLastPosition = lastDeleted - (removedCount - 1);
  const afterLast = steps[afterLastPosition] as { id?: string } | undefined;
  if (afterLast?.id) return focusItem(afterLast.id as ItemId);

  // No item sits after the deletion range. Apply the previous-sibling
  // rule to the first-deleted original position: the item now at
  // `firstDeleted - 1` is the one just before the earliest deletion.
  if (firstDeleted > 0) {
    const prev = steps[firstDeleted - 1] as { id?: string } | undefined;
    if (prev?.id) return focusItem(prev.id as ItemId);
  }

  // Items still remain somewhere in the list (e.g. a non-contiguous
  // delete that took [0, 2] out of [a, b, c] leaves [b] at index 0,
  // where both "after last" and "before first" checks miss). Anchor
  // focus on whatever survives nearest the original first-deleted
  // position rather than collapsing to empty-state when the list is
  // not actually empty.
  const candidate = steps[Math.min(firstDeleted, steps.length - 1)] as
    | { id?: string }
    | undefined;
  if (candidate?.id) return focusItem(candidate.id as ItemId);

  return focusEmptyState;
};
