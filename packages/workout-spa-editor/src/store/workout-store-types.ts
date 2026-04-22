/**
 * Workout Store Types — composed type + supporting shape re-exports.
 *
 * Concrete field / action lists live in the split files alongside this
 * one, so every file stays under the ≤80-line-per-file rule.
 */

import type { WorkoutStoreActions } from "./workout-store-actions.types";
import type { WorkoutStoreState } from "./workout-store-state.types";

export type { DeletedStep, ModalConfig } from "./workout-store-state.types";

export type WorkoutStore = WorkoutStoreState & WorkoutStoreActions;
