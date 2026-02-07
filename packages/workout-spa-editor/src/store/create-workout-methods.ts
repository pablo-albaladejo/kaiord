import { createAllWorkoutMethods } from "./create-workout-method-helpers";
import type { createWorkoutStoreActions } from "./workout-store-actions";
import type { WorkoutStore } from "./workout-store-types";
import type { StoreApi } from "zustand";

export const createWorkoutMethods = (
  actions: ReturnType<typeof createWorkoutStoreActions>,
  set: StoreApi<WorkoutStore>["setState"],
  get: StoreApi<WorkoutStore>["getState"]
) => createAllWorkoutMethods(actions, set, get);
