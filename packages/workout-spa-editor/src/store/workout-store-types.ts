/**
 * Workout Store Types
 *
 * Composition of the store's state, action, and focus-slice type files.
 * Each constituent file lives next to this one to respect the file-size
 * invariant.
 */

import type { FocusSlice } from "./focus/focus-slice.types";
import type { WorkoutStoreActions } from "./workout-store-actions.types";
import type { WorkoutStoreState } from "./workout-store-state.types";

export type { DeletedStep, ModalConfig } from "./workout-store-state.types";

export type WorkoutStore = WorkoutStoreState & WorkoutStoreActions & FocusSlice;
