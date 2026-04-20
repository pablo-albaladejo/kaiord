import type { StoreApi } from "zustand";

import type { FocusSlice, FocusSliceState } from "./focus-slice.types";
import type { FocusTarget } from "./focus-target.types";

export const initialFocusSliceState: FocusSliceState = {
  pendingFocusTarget: null,
  selectionHistory: [],
};

export const createFocusSlice = <T extends FocusSlice>(
  set: StoreApi<T>["setState"]
): FocusSlice => ({
  ...initialFocusSliceState,
  setPendingFocusTarget: (target: FocusTarget | null) =>
    set({ pendingFocusTarget: target } as Partial<T>),
});
