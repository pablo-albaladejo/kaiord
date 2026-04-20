import type { UIWorkout } from "../../types/krd-ui";
import type { FocusTarget } from "../focus/focus-target.types";
import type { ItemId } from "../providers/item-id";
import { containsItemId, getMainListItems } from "./shared-lookups";

export const preservedSelectionTarget = (
  workout: UIWorkout,
  previouslySelectedId: ItemId | null,
  fallbackIndex: number
): FocusTarget => {
  if (previouslySelectedId && containsItemId(workout, previouslySelectedId)) {
    return { kind: "item", id: previouslySelectedId };
  }
  const items = getMainListItems(workout);
  const candidate = items[fallbackIndex];
  if (candidate) return { kind: "item", id: candidate.id };
  return { kind: "empty-state" };
};
