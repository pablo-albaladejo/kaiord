import { useCallback } from "react";
import { useToastContext } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";
import {
  useCreateStep,
  useDeleteStep,
  useDuplicateStep,
  useIsEditing,
  useReorderStep,
  useToggleStepSelection,
  useUndoDelete,
} from "../../../store/workout-store-selectors";
import type { KRD, Workout } from "../../../types/krd";
import { useRepetitionBlockHandlers } from "./use-repetition-block-handlers";
import { useCopyStep } from "./useCopyStep";
import { usePasteStep } from "./usePasteStep";
import { useSelectedStep } from "./useSelectedStep";
import { useWorkoutSectionHandlers } from "./useWorkoutSectionHandlers";

export function useWorkoutSectionState(
  workout: Workout,
  krd: KRD,
  selectedStepId: string | null,
  onStepSelect: (stepId: string) => void,
  onStepReorder?: (activeIndex: number, overIndex: number) => void,
  onReorderStepsInBlock?: (
    blockId: string,
    activeIndex: number,
    overIndex: number
  ) => void
) {
  const isEditing = useIsEditing();
  const createStep = useCreateStep();
  const storeDeleteStep = useDeleteStep();
  const undoDelete = useUndoDelete();
  const duplicateStep = useDuplicateStep();
  const { toast } = useToastContext();

  // Wrap deleteStep to show toast with undo option
  const deleteStep = useCallback(
    (stepIndex: number) => {
      storeDeleteStep(stepIndex);

      // Get the timestamp of the most recently deleted step
      // We need to do this after the delete action completes
      setTimeout(() => {
        const deletedSteps = useWorkoutStore.getState().deletedSteps;
        const mostRecentDelete = deletedSteps[deletedSteps.length - 1];

        if (mostRecentDelete) {
          // Show toast with undo option
          toast({
            title: "Step deleted",
            description: "The step has been removed from your workout.",
            variant: "info",
            duration: 5000,
            action: (
              <button
                onClick={() => undoDelete(mostRecentDelete.timestamp)}
                data-testid="undo-delete-button"
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent px-3 text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:pointer-events-none disabled:opacity-50"
              >
                Undo
              </button>
            ),
          });
        }
      }, 0);
    },
    [storeDeleteStep, undoDelete, toast]
  );
  const copyStep = useCopyStep();
  const pasteStep = usePasteStep();
  const defaultReorderStep = useReorderStep();
  const reorderStep = onStepReorder || defaultReorderStep;
  const selectedStep = useSelectedStep(selectedStepId, workout);
  const handlers = useWorkoutSectionHandlers(workout, krd, onStepSelect);

  const toggleStepSelection = useToggleStepSelection();
  const repetitionBlockHandlers = useRepetitionBlockHandlers();

  const handleToggleStepSelection = (stepId: string) => {
    toggleStepSelection(stepId);
  };

  return {
    isEditing,
    createStep,
    deleteStep,
    duplicateStep,
    copyStep,
    pasteStep,
    reorderStep,
    reorderStepsInBlock: onReorderStepsInBlock,
    selectedStep,
    selectedStepIds: repetitionBlockHandlers.selectedStepIds,
    showCreateBlockDialog: repetitionBlockHandlers.showCreateBlockDialog,
    handleToggleStepSelection,
    handleCreateRepetitionBlock:
      repetitionBlockHandlers.handleCreateRepetitionBlock,
    handleCreateEmptyRepetitionBlock:
      repetitionBlockHandlers.handleCreateEmptyRepetitionBlock,
    handleConfirmCreateBlock: repetitionBlockHandlers.handleConfirmCreateBlock,
    handleCancelCreateBlock: repetitionBlockHandlers.handleCancelCreateBlock,
    handleEditRepetitionBlock:
      repetitionBlockHandlers.handleEditRepetitionBlock,
    handleAddStepToRepetitionBlock:
      repetitionBlockHandlers.handleAddStepToRepetitionBlock,
    handleUngroupRepetitionBlock: repetitionBlockHandlers.handleUngroup,
    handleDeleteRepetitionBlock: repetitionBlockHandlers.handleDelete,
    handleDuplicateStepInRepetitionBlock:
      repetitionBlockHandlers.handleDuplicateStepInRepetitionBlock,
    ...handlers,
  };
}
