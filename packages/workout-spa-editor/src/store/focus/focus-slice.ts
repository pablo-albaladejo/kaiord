import type { StoreApi } from "zustand";

import type { WorkoutStore } from "../workout-store-types";
import type { FocusTarget } from "./focus-target.types";

/**
 * Focus-slice state + actions.
 *
 * `pendingFocusTarget` carries an "intent" written by mutating actions.
 * The `useFocusAfterAction` hook (landing in §7) reads the target after
 * every React commit and moves DOM focus accordingly. No consumer lives
 * in the same file — keep this slice dumb: set / clear only.
 */
export type FocusSlice = {
  pendingFocusTarget: FocusTarget | null;
  setPendingFocusTarget: (target: FocusTarget | null) => void;
};

/**
 * Factory for the focus slice. Accepts the store's `set` so the slice
 * composes cleanly with the rest of the workout store.
 */
export const createFocusSlice = (
  set: StoreApi<WorkoutStore>["setState"]
): FocusSlice => ({
  pendingFocusTarget: null,
  setPendingFocusTarget: (target) => set({ pendingFocusTarget: target }),
});
