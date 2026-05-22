import { create } from "zustand";

import { createHistoryMethods } from "./create-history-methods";
import { createRecoveryMethods } from "./create-recovery-methods";
import { createWorkoutMethods } from "./create-workout-methods";
import { createFocusSlice } from "./focus/focus-slice";
import { createWorkoutStoreActions } from "./workout-store-actions";
import { createModalActions } from "./workout-store-modal-actions";
import { createSelectionActions } from "./workout-store-selection-actions";
import type { WorkoutStore } from "./workout-store-types";
export type { WorkoutStore } from "./workout-store-types";

export const useWorkoutStore = create<WorkoutStore>((set, get) => {
  const actions = createWorkoutStoreActions();
  return {
    currentWorkout: null,
    undoHistory: [],
    historyIndex: -1,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
    safeMode: false,
    lastBackup: null,
    deletedSteps: [],
    isModalOpen: false,
    modalConfig: null,
    createBlockDialogOpen: false,
    ...createFocusSlice(set),
    ...createWorkoutMethods(actions, set, get),
    ...createSelectionActions(set),
    setEditing: (editing) => set({ isEditing: editing }),
    ...createHistoryMethods(set, get),
    ...createRecoveryMethods(set, get),
    ...createModalActions(set),
  };
});

// Expose for e2e test seeding (dev mode only). Mirrors __KAIORD_DB__
// in `adapters/dexie/dexie-database.ts`; production builds tree-shake.
if (import.meta.env.DEV && typeof window !== "undefined") {
  const w = window as unknown as Record<string, unknown>;
  w.__KAIORD_WORKOUT_STORE__ = useWorkoutStore;
}
