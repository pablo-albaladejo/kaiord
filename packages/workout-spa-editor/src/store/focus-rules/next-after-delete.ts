/**
 * Rule: focus the "next logical item" after a single delete.
 *
 * Branches (from the proposal Goals section):
 *   - Main-list delete, next sibling exists → next sibling.
 *   - Main-list delete, no next → previous sibling.
 *   - Main-list delete, list becomes empty → main-list empty-state.
 *   - Block-child delete, next sibling in the same block → that sibling.
 *   - Block-child delete, no next in block → previous sibling in block.
 *   - Block-child delete, the block is now empty (cascade) → the parent
 *     block card stays selected. The block-deletion itself is the next
 *     action the store dispatches; this rule just anchors focus to the
 *     parent until that cascade lands.
 *
 * Inputs are the post-delete workout (the item is already gone),
 * the deleted item's original position context, and the parent block
 * id when the deletion happened inside a repetition block.
 *
 * Purity: no React, no DOM, no store reads.
 */

import type { Workout } from "../../types/krd";
import { findById } from "../find-by-id";
import type { FocusTarget } from "../focus/focus-target.types";
import { focusEmptyState, focusItem } from "../focus/focus-target.types";
import type { ItemId } from "../providers/item-id";

type NextAfterDeleteInput = {
  workout: Workout | undefined;
  /** Flat index the deleted item occupied before the mutation. */
  deletedIndex: number;
  /** Block the item lived inside, if any. */
  parentBlockId?: ItemId;
};

export const nextAfterDelete = (input: NextAfterDeleteInput): FocusTarget => {
  const { workout, deletedIndex, parentBlockId } = input;
  if (!workout) return focusEmptyState;

  if (parentBlockId) {
    return nextInsideBlock(workout, parentBlockId, deletedIndex);
  }
  return nextInMainList(workout, deletedIndex);
};

const nextInMainList = (
  workout: Workout,
  deletedIndex: number
): FocusTarget => {
  const steps = workout.steps;
  if (steps.length === 0) return focusEmptyState;

  // Try the same index first (the old next-sibling slid up into this slot).
  const next = steps[deletedIndex] as { id?: string } | undefined;
  if (next?.id) return focusItem(next.id as ItemId);

  // No next → previous sibling.
  if (deletedIndex > 0) {
    const prev = steps[deletedIndex - 1] as { id?: string } | undefined;
    if (prev?.id) return focusItem(prev.id as ItemId);
  }

  return focusEmptyState;
};

const nextInsideBlock = (
  workout: Workout,
  parentBlockId: ItemId,
  deletedIndex: number
): FocusTarget => {
  const found = findById(workout, parentBlockId);
  if (!found || found.kind !== "block") {
    // Block was cascaded away (or the caller passed a bad id). The
    // parent-block handle is gone — fall back to main-list rules at
    // the position the item originally occupied so focus lands as
    // close as possible to where the user was acting, rather than
    // resetting to the top of the list.
    return nextInMainList(workout, deletedIndex);
  }

  const blockSteps = found.block.steps;
  if (blockSteps.length === 0) {
    // Block is now empty; anchor focus to the parent block card. The
    // consumer (§6 `deleteStep` wiring) is expected to cascade into
    // `deleteRepetitionBlock` next.
    return focusItem(parentBlockId);
  }

  const next = blockSteps[deletedIndex] as { id?: string } | undefined;
  if (next?.id) return focusItem(next.id as ItemId);

  if (deletedIndex > 0) {
    const prev = blockSteps[deletedIndex - 1] as { id?: string } | undefined;
    if (prev?.id) return focusItem(prev.id as ItemId);
  }

  return focusItem(parentBlockId);
};
