/**
 * Workout Store Types — composed type + supporting shape re-exports.
 *
 * Concrete field / action lists live in the sibling `*.types.ts` files.
 */

import type { WorkoutStoreActions } from "./workout-store-actions.types";
import type { WorkoutStoreState } from "./workout-store-state.types";

export type { DeletedStep, ModalConfig } from "./workout-store-state.types";

export type WorkoutStore = WorkoutStoreState & WorkoutStoreActions;
