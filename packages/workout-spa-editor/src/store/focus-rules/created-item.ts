import type { FocusTarget } from "../focus/focus-target.types";
import type { ItemId } from "../providers/item-id";

export const createdItemTarget = (newItemId: ItemId): FocusTarget => ({
  kind: "item",
  id: newItemId,
});
