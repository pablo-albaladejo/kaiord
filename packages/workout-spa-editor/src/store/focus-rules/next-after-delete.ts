import type { UIWorkout } from "../../types/krd-ui";
import type { FocusTarget } from "../focus/focus-target.types";
import type { ItemId } from "../providers/item-id";
import { findBlockInMainList, getMainListItems } from "./shared-lookups";

const fromMainList = (workout: UIWorkout, deletedId: ItemId): FocusTarget => {
  const items = getMainListItems(workout);
  const idx = items.findIndex((item) => item.id === deletedId);
  if (idx === -1) return { kind: "empty-state" };
  const next = items[idx + 1];
  if (next) return { kind: "item", id: next.id };
  const prev = items[idx - 1];
  if (prev) return { kind: "item", id: prev.id };
  return { kind: "empty-state" };
};

/**
 * Pure focus rule for a single-item delete.
 *
 * - Main list: next sibling → previous sibling → empty-state.
 * - Block child: next step in block → previous step in block → cascade to
 *   main-list rule keyed by the now-empty parent block (the block itself
 *   will be removed by the action handler).
 */
export const nextAfterDelete = (
  workout: UIWorkout,
  deletedItemId: ItemId,
  parentBlockId?: ItemId
): FocusTarget => {
  if (!parentBlockId) return fromMainList(workout, deletedItemId);

  const parent = findBlockInMainList(workout, parentBlockId);
  if (!parent) return fromMainList(workout, deletedItemId);

  const stepIdx = parent.block.steps.findIndex((s) => s.id === deletedItemId);
  if (stepIdx === -1) return fromMainList(workout, parentBlockId);

  const nextStep = parent.block.steps[stepIdx + 1];
  if (nextStep) return { kind: "item", id: nextStep.id };
  const prevStep = parent.block.steps[stepIdx - 1];
  if (prevStep) return { kind: "item", id: prevStep.id };

  return fromMainList(workout, parentBlockId);
};
