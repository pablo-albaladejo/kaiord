import type { ItemId } from "../providers/item-id";
import type { FocusTarget } from "./focus-target.types";

export type FocusSliceState = {
  pendingFocusTarget: FocusTarget | null;
  selectionHistory: Array<ItemId | null>;
};

export type FocusSliceActions = {
  setPendingFocusTarget: (target: FocusTarget | null) => void;
};

export type FocusSlice = FocusSliceState & FocusSliceActions;
