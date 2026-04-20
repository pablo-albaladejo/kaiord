import type { UIWorkout } from "../../types/krd-ui";
import type { FocusTarget } from "../focus/focus-target.types";
import type { ItemId } from "../providers/item-id";
import { containsItemId } from "./shared-lookups";

export const restoredAfterUndoTarget = (
  workout: UIWorkout,
  restoredItemId: ItemId
): FocusTarget =>
  containsItemId(workout, restoredItemId)
    ? { kind: "item", id: restoredItemId }
    : { kind: "empty-state" };
