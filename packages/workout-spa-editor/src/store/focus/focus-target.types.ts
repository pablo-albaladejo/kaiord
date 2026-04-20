import type { ItemId } from "../providers/item-id";

export type FocusTargetItem = { kind: "item"; id: ItemId };
export type FocusTargetEmptyState = { kind: "empty-state" };

export type FocusTarget = FocusTargetItem | FocusTargetEmptyState;
