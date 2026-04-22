/**
 * Rule: focus the item restored by an `undoDelete` mutation.
 *
 * Input is the item's stable `ItemId` as captured in `deletedSteps`.
 * If the restored item is actually present in the post-undo workout,
 * focus it. Otherwise fall back to the main-list empty-state — that
 * only happens when the caller hands us an id that never made it back
 * in (a caller bug), but the rule stays defensive so a mis-wired
 * consumer cannot crash focus dispatch.
 *
 * Purity: no React, no DOM, no store reads.
 */

import type { Workout } from "../../types/krd";
import { findById } from "../find-by-id";
import type { FocusTarget } from "../focus/focus-target.types";
import { focusEmptyState, focusItem } from "../focus/focus-target.types";
import type { ItemId } from "../providers/item-id";

export const restoredAfterUndoTarget = (
  workout: Workout | undefined,
  restoredItemId: ItemId
): FocusTarget => {
  const found = findById(workout, restoredItemId);
  if (found) return focusItem(restoredItemId);
  return focusEmptyState;
};
