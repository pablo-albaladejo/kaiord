/* eslint-disable max-lines */
/** Workout Store - Zustand store for managing workout state with undo/redo. Requirements: 15 (undo/redo), 16 (track editing state) */
import { create } from "zustand";
import type { KRD, Sport } from "../types/krd";
import { addStepToRepetitionBlockAction } from "./actions/add-step-to-repetition-block-action";
import { createRepetitionBlockAction } from "./actions/create-repetition-block-action";
import { editRepetitionBlockAction } from "./actions/edit-repetition-block-action";
import { createStepAction } from "./actions/create-step-action";
import { deleteStepAction } from "./actions/delete-step-action";
import { duplicateStepAction } from "./actions/duplicate-step-action";
// prettier-ignore
import { createBackupAction, disableSafeModeAction, enableSafeModeAction, restoreFromBackupAction } from "./actions/error-recovery-actions";
// prettier-ignore
import { createClearWorkoutAction, createEmptyWorkoutAction, createLoadWorkoutAction, createRedoAction, createUndoAction, createUpdateWorkoutAction } from "./workout-actions";
import type { WorkoutStore } from "./workout-store-types";
export type { WorkoutStore } from "./workout-store-types";
export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  currentWorkout: null,
  workoutHistory: [],
  historyIndex: -1,
  selectedStepId: null,
  selectedStepIds: [],
  isEditing: false,
  safeMode: false,
  lastBackup: null,
  loadWorkout: (krd: KRD) => set(createLoadWorkoutAction(krd)),
  createEmptyWorkout: (name: string, sport: Sport) =>
    set(createEmptyWorkoutAction(name, sport)),
  updateWorkout: (krd: KRD) =>
    set((state) => createUpdateWorkoutAction(krd, state)),
  createStep: () =>
    set((state) =>
      !state.currentWorkout ? {} : createStepAction(state.currentWorkout, state)
    ),
  deleteStep: (stepIndex: number) =>
    set((state) =>
      !state.currentWorkout
        ? {}
        : deleteStepAction(state.currentWorkout, stepIndex, state)
    ),
  duplicateStep: (stepIndex: number) =>
    set((state) =>
      !state.currentWorkout
        ? {}
        : duplicateStepAction(state.currentWorkout, stepIndex, state)
    ),
  createRepetitionBlock: (stepIndices: Array<number>, repeatCount: number) =>
    set((state) =>
      !state.currentWorkout
        ? {}
        : createRepetitionBlockAction(
            state.currentWorkout,
            stepIndices,
            repeatCount,
            state
          )
    ),
  editRepetitionBlock: (blockIndex: number, repeatCount: number) =>
    set((state) =>
      !state.currentWorkout
        ? {}
        : editRepetitionBlockAction(
            state.currentWorkout,
            blockIndex,
            repeatCount,
            state
          )
    ),
  addStepToRepetitionBlock: (blockIndex: number) =>
    set((state) =>
      !state.currentWorkout
        ? {}
        : addStepToRepetitionBlockAction(
            state.currentWorkout,
            blockIndex,
            state
          )
    ),
  selectStep: (id: string | null) =>
    set({ selectedStepId: id, selectedStepIds: [] }),
  toggleStepSelection: (id: string) =>
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
  setEditing: (editing: boolean) => set({ isEditing: editing }),
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
}));
