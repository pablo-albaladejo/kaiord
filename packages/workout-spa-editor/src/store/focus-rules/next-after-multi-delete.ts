import type { UIWorkout, UIWorkoutItem } from "../../types/krd-ui";
import type { FocusTarget } from "../focus/focus-target.types";
import type { ItemId } from "../providers/item-id";
import { findBlockInMainList, getMainListItems } from "./shared-lookups";

const pickAfterLast = (
  items: ReadonlyArray<{ id: ItemId }>,
  deleted: ReadonlySet<ItemId>,
  lastDeletedIdx: number
): FocusTarget | null => {
  for (let i = lastDeletedIdx + 1; i < items.length; i++) {
    if (!deleted.has(items[i].id)) return { kind: "item", id: items[i].id };
  }
  return null;
};

const pickBeforeFirst = (
  items: ReadonlyArray<{ id: ItemId }>,
  deleted: ReadonlySet<ItemId>,
  firstDeletedIdx: number
): FocusTarget | null => {
  for (let i = firstDeletedIdx - 1; i >= 0; i--) {
    if (!deleted.has(items[i].id)) return { kind: "item", id: items[i].id };
  }
  return null;
};

const computeTarget = (
  items: ReadonlyArray<{ id: ItemId }>,
  deleted: ReadonlySet<ItemId>
): FocusTarget => {
  const deletedIdxs: Array<number> = [];
  for (let i = 0; i < items.length; i++) {
    if (deleted.has(items[i].id)) deletedIdxs.push(i);
  }
  if (deletedIdxs.length === 0) return { kind: "empty-state" };
  const first = deletedIdxs[0];
  const last = deletedIdxs[deletedIdxs.length - 1];
  return (
    pickAfterLast(items, deleted, last) ??
    pickBeforeFirst(items, deleted, first) ?? { kind: "empty-state" }
  );
};

export const nextAfterMultiDelete = (
  workout: UIWorkout,
  deletedIds: ReadonlyArray<ItemId>,
  parentBlockId?: ItemId
): FocusTarget => {
  const deleted: ReadonlySet<ItemId> = new Set(deletedIds);
  if (parentBlockId) {
    const parent = findBlockInMainList(workout, parentBlockId);
    if (!parent) return { kind: "empty-state" };
    return computeTarget(parent.block.steps, deleted);
  }
  const mainItems = getMainListItems(workout) as ReadonlyArray<UIWorkoutItem>;
  return computeTarget(mainItems, deleted);
};
