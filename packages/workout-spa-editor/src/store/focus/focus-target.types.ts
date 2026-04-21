/**
 * FocusTarget — discriminated union of "what should receive focus next"
 * after a store mutation.
 *
 * Every mutating action that wants to express a focus intent sets
 * `pendingFocusTarget` to one of these variants. A single hook
 * (`useFocusAfterAction`, landing in §7) reads the target after each
 * commit and moves DOM focus accordingly.
 */

import type { ItemId } from "../providers/item-id";

export type FocusTargetItem = {
  readonly kind: "item";
  readonly id: ItemId;
};

export type FocusTargetEmptyState = {
  readonly kind: "empty-state";
};

export type FocusTarget = FocusTargetItem | FocusTargetEmptyState;

/** Constructor for an item target — keeps the brand at call sites. */
export const focusItem = (id: ItemId): FocusTargetItem => ({
  kind: "item",
  id,
});

/** Sentinel for the main-list empty-state button. */
export const focusEmptyState: FocusTargetEmptyState = { kind: "empty-state" };
