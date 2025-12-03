import { create } from "zustand";
import { createHistoryMethods } from "./create-history-methods";
import { createRecoveryMethods } from "./create-recovery-methods";
import { createWorkoutMethods } from "./create-workout-methods";
import { createWorkoutStoreActions } from "./workout-store-actions";
import { createModalActions } from "./workout-store-modal-actions";
import { createSelectionActions } from "./workout-store-selection-actions";
import type { WorkoutStore } from "./workout-store-types";
export type { WorkoutStore } from "./workout-store-types";

export const useWorkoutStore = create<WorkoutStore>((set, get) => {
  const actions = createWorkoutStoreActions();
  return {
    currentWorkout: null,
    workoutHistory: [],
    historyIndex: -1,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
    safeMode: false,
    lastBackup: null,
    deletedSteps: [],
    isModalOpen: false,
    modalConfig: null,
    ...createWorkoutMethods(actions, set, get),
    ...createSelectionActions(set),
    setEditing: (editing) => set({ isEditing: editing }),
    ...createHistoryMethods(set, get),
    ...createRecoveryMethods(set, get),
    ...createModalActions(set),
  };
});
