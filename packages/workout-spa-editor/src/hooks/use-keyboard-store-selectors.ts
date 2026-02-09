/**
 * Keyboard Store Selectors
 *
 * Extracts store selectors needed by useAppKeyboardHandlers
 * into a dedicated hook to keep the main hook body small.
 */

import { useWorkoutStore } from "../store/workout-store";
import {
  useCurrentWorkout,
  useSelectedStepId,
  useSelectedStepIds,
} from "../store/workout-store-selectors";

export function useKeyboardStoreSelectors() {
  const currentWorkout = useCurrentWorkout();
  const selectedStepId = useSelectedStepId();
  const selectedStepIds = useSelectedStepIds();
  const undo = useWorkoutStore((s) => s.undo);
  const redo = useWorkoutStore((s) => s.redo);
  const reorderStep = useWorkoutStore((s) => s.reorderStep);
  const canUndo = useWorkoutStore((s) => s.canUndo());
  const canRedo = useWorkoutStore((s) => s.canRedo());
  const openCreateBlockDialog = useWorkoutStore((s) => s.openCreateBlockDialog);
  const ungroupRepetitionBlock = useWorkoutStore(
    (s) => s.ungroupRepetitionBlock
  );
  const selectAllSteps = useWorkoutStore((s) => s.selectAllSteps);
  const selectStep = useWorkoutStore((s) => s.selectStep);
  const clearStepSelection = useWorkoutStore((s) => s.clearStepSelection);

  return {
    currentWorkout,
    selectedStepId,
    selectedStepIds,
    undo,
    redo,
    reorderStep,
    canUndo,
    canRedo,
    openCreateBlockDialog,
    ungroupRepetitionBlock,
    selectAllSteps,
    selectStep,
    clearStepSelection,
  };
}
