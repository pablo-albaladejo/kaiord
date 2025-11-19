/** Workout Store - Zustand store for managing workout state with undo/redo. Requirements: 15 (undo/redo), 16 (track editing state) */
import { create } from "zustand";
// prettier-ignore
import { createBackupAction, disableSafeModeAction, enableSafeModeAction, restoreFromBackupAction } from "./actions/error-recovery-actions";
// prettier-ignore
import { createClearWorkoutAction, createRedoAction, createUndoAction } from "./workout-actions";
import { createWorkoutStoreActions } from "./workout-store-actions";
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
    loadWorkout: (krd) => set(actions.loadWorkout(krd)),
    createEmptyWorkout: (name, sport) =>
      set(actions.createEmptyWorkout(name, sport)),
    updateWorkout: (krd) => set((state) => actions.updateWorkout(krd, state)),
    createStep: () => set((state) => actions.createStep(state)),
    deleteStep: (stepIndex) =>
      set((state) => actions.deleteStep(stepIndex, state)),
    duplicateStep: (stepIndex) =>
      set((state) => actions.duplicateStep(stepIndex, state)),
    createRepetitionBlock: (stepIndices, repeatCount) =>
      set((state) =>
        actions.createRepetitionBlock(stepIndices, repeatCount, state)
      ),
    createEmptyRepetitionBlock: (repeatCount) =>
      set((state) => actions.createEmptyRepetitionBlock(repeatCount, state)),
    editRepetitionBlock: (blockIndex, repeatCount) =>
      set((state) =>
        actions.editRepetitionBlock(blockIndex, repeatCount, state)
      ),
    addStepToRepetitionBlock: (blockIndex) =>
      set((state) => actions.addStepToRepetitionBlock(blockIndex, state)),
    selectStep: (id) => set({ selectedStepId: id, selectedStepIds: [] }),
    toggleStepSelection: (id) =>
      set((state) => {
        const isSelected = state.selectedStepIds.includes(id);
        return {
          selectedStepIds: isSelected
            ? state.selectedStepIds.filter((stepId) => stepId !== id)
            : [...state.selectedStepIds, id],
          selectedStepId: null,
        };
      }),
    clearStepSelection: () => set({ selectedStepIds: [] }),
    setEditing: (editing) => set({ isEditing: editing }),
    clearWorkout: () => set(createClearWorkoutAction()),
    undo: () => set((state) => createUndoAction(state)),
    redo: () => set((state) => createRedoAction(state)),
    createBackup: () => set((state) => createBackupAction(state)),
    restoreFromBackup: () => {
      const result = restoreFromBackupAction(get());
      if (result.success) {
        set(result);
        return true;
      }
      return false;
    },
    enableSafeMode: () => set(enableSafeModeAction()),
    disableSafeMode: () => set(disableSafeModeAction()),
    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().workoutHistory.length - 1,
    hasBackup: () => get().lastBackup !== null,
  };
});
