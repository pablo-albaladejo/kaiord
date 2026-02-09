/**
 * Workout Store Selectors
 *
 * Individual selector hooks for accessing workout store state.
 * Using individual selectors prevents unnecessary re-renders.
 */

import { useWorkoutStore } from "./workout-store";

/**
 * Get the current workout
 */
export const useCurrentWorkout = () =>
  useWorkoutStore((state) => state.currentWorkout);

/**
 * Get the selected step ID
 */
export const useSelectedStepId = () =>
  useWorkoutStore((state) => state.selectedStepId);
export const useSelectedStepIds = () =>
  useWorkoutStore((state) => state.selectedStepIds);
export const useToggleStepSelection = () =>
  useWorkoutStore((state) => state.toggleStepSelection);
export const useClearStepSelection = () =>
  useWorkoutStore((state) => state.clearStepSelection);
export const useCreateRepetitionBlock = () =>
  useWorkoutStore((state) => state.createRepetitionBlock);
export const useCreateEmptyRepetitionBlock = () =>
  useWorkoutStore((state) => state.createEmptyRepetitionBlock);
export const useEditRepetitionBlock = () =>
  useWorkoutStore((state) => state.editRepetitionBlock);
export const useAddStepToRepetitionBlock = () =>
  useWorkoutStore((state) => state.addStepToRepetitionBlock);
export const useDuplicateStepInRepetitionBlock = () =>
  useWorkoutStore((state) => state.duplicateStepInRepetitionBlock);
export const useUngroupRepetitionBlock = () =>
  useWorkoutStore((state) => state.ungroupRepetitionBlock);
export const useDeleteRepetitionBlock = () =>
  useWorkoutStore((state) => state.deleteRepetitionBlock);

/**
 * Get the editing state
 */
export const useIsEditing = () => useWorkoutStore((state) => state.isEditing);

/**
 * Get undo/redo availability (Requirement 15)
 */
export const useCanUndo = () => useWorkoutStore((state) => state.canUndo());

/**
 * Get redo availability (Requirement 15)
 */
export const useCanRedo = () => useWorkoutStore((state) => state.canRedo());

/**
 * Get individual workout actions
 * Use these instead of a combined object to avoid re-render issues
 */
export const useLoadWorkout = () =>
  useWorkoutStore((state) => state.loadWorkout);

export const useUpdateWorkout = () =>
  useWorkoutStore((state) => state.updateWorkout);

export const useCreateStep = () => useWorkoutStore((state) => state.createStep);

export const useDeleteStep = () => useWorkoutStore((state) => state.deleteStep);

export const useUndoDelete = () => useWorkoutStore((state) => state.undoDelete);

export const useClearExpiredDeletes = () =>
  useWorkoutStore((state) => state.clearExpiredDeletes);

export const useDeletedSteps = () =>
  useWorkoutStore((state) => state.deletedSteps);

export const useSelectStep = () => useWorkoutStore((state) => state.selectStep);

export const useDuplicateStep = () =>
  useWorkoutStore((state) => state.duplicateStep);

export const useReorderStep = () =>
  useWorkoutStore((state) => state.reorderStep);

export const useSetEditing = () => useWorkoutStore((state) => state.setEditing);

export const useClearWorkout = () =>
  useWorkoutStore((state) => state.clearWorkout);

export const useUndo = () => useWorkoutStore((state) => state.undo);

export const useRedo = () => useWorkoutStore((state) => state.redo);

export const useIsModalOpen = () =>
  useWorkoutStore((state) => state.isModalOpen);

export const useModalConfig = () =>
  useWorkoutStore((state) => state.modalConfig);

export const useShowConfirmationModal = () =>
  useWorkoutStore((state) => state.showConfirmationModal);

export const useHideConfirmationModal = () =>
  useWorkoutStore((state) => state.hideConfirmationModal);
