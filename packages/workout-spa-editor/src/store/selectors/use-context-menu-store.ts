/**
 * Context-menu store selectors
 *
 * Aggregates the slice of workout-store state and actions consumed by
 * the editor context menu (selection, clipboard, history, repetition
 * blocks, create-block dialog). Composes per-domain selectors so the
 * context-menu hook stays declarative and small.
 */

import { useCopyStep } from "../../components/pages/WorkoutSection/useCopyStep";
import { usePasteStep } from "../../components/pages/WorkoutSection/usePasteStep";
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

export function useContextMenuStore() {
  const currentWorkout = useCurrentWorkout();
  const selectedStepId = useSelectedStepId();
  const selectedStepIds = useSelectedStepIds();
  const selectStep = useSelectStep();
  const clearStepSelection = useClearStepSelection();
  const deleteStep = useDeleteStep();
  const copyStep = useCopyStep();
  const pasteStep = usePasteStep();
  const openCreateBlockDialog = useOpenCreateBlockDialog();
  const ungroupRepetitionBlock = useUngroupRepetitionBlock();
  const selectAllSteps = useWorkoutStore((s) => s.selectAllSteps);
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const reorderStep = useReorderStep();

  return {
    currentWorkout,
    selectedStepId,
    selectedStepIds,
    selectStep,
    clearStepSelection,
    deleteStep,
    copyStep,
    pasteStep,
    openCreateBlockDialog,
    ungroupRepetitionBlock,
    selectAllSteps,
    undo,
    redo,
    canUndo,
    canRedo,
    reorderStep,
  };
}
