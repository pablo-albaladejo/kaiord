/**
 * Rule: focus the "previously selected" item after a mutation that did
 * not explicitly create or delete anything the user was acting on
 * (undo of add / paste / duplicate, redo, …).
 *
 * Order of preference:
 *   1. The prior selection id is still present in the workout → focus it.
 *   2. Some other item now sits at the prior selection's main-list
 *      position (`fallbackIndex`) → focus that item.
 *   3. The list is empty → focus the main-list empty-state.
 *
 * Purity: no React, no DOM, no store reads.
 */

import type { Workout } from "../../types/krd";
import { findById } from "../find-by-id";
import type { FocusTarget } from "../focus/focus-target.types";
import { focusEmptyState, focusItem } from "../focus/focus-target.types";
import type { ItemId } from "../providers/item-id";

export const preservedSelectionTarget = (
  workout: Workout | undefined,
  previouslySelectedId: ItemId | null,
  fallbackIndex: number
): FocusTarget => {
  if (previouslySelectedId && findById(workout, previouslySelectedId)) {
    return focusItem(previouslySelectedId);
  }

  const steps = workout?.steps ?? [];
  const itemAtFallback = steps[fallbackIndex] as { id?: string } | undefined;
  if (itemAtFallback?.id) {
    return focusItem(itemAtFallback.id as ItemId);
  }

  return focusEmptyState;
};
