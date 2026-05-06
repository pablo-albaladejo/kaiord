/**
 * Keyboard store selectors
 *
 * Aggregates the slice of workout-store state and actions consumed by
 * `useAppKeyboardHandlers`. Kept as a composite hook so the keyboard-
 * handler module stays small and only depends on a single import.
 */

import { useWorkoutStore } from "../workout-store";
import { useCanRedo, useCanUndo, useRedo, useUndo } from "./history-selectors";
import { useOpenCreateBlockDialog } from "./modal-selectors";
import { useUngroupRepetitionBlock } from "./repetition-block-selectors";
import {
  useClearStepSelection,
  useSelectedStepId,
  useSelectedStepIds,
  useSelectStep,
} from "./selection-selectors";
import { useDeleteStep, useReorderStep } from "./step-selectors";
import { useCurrentWorkout } from "./workout-selectors";

export function useKeyboardStoreSelectors() {
  const currentWorkout = useCurrentWorkout();
  const selectedStepId = useSelectedStepId();
  const selectedStepIds = useSelectedStepIds();
  const undo = useUndo();
  const redo = useRedo();
  const reorderStep = useReorderStep();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const openCreateBlockDialog = useOpenCreateBlockDialog();
  const ungroupRepetitionBlock = useUngroupRepetitionBlock();
  const selectAllSteps = useWorkoutStore((s) => s.selectAllSteps);
  const selectStep = useSelectStep();
  const clearStepSelection = useClearStepSelection();
  const deleteStep = useDeleteStep();

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
    deleteStep,
  };
}
