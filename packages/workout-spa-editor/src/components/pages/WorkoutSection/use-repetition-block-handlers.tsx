import { useCallback, useState } from "react";
import { useToastContext } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";
import {
  useAddStepToRepetitionBlock,
  useClearStepSelection,
  useCreateEmptyRepetitionBlock,
  useCreateRepetitionBlock,
  useDeleteRepetitionBlock,
  useDuplicateStepInRepetitionBlock,
  useEditRepetitionBlock,
  useSelectedStepIds,
  useUndoDelete,
  useUngroupRepetitionBlock,
} from "../../../store/workout-store-selectors";

function extractStepIndices(selectedStepIds: readonly string[]): Array<number> {
  return selectedStepIds
    .map((id) => {
      const match = id.match(/^step-(\d+)$/);
      return match ? Number.parseInt(match[1], 10) : null;
    })
    .filter((index): index is number => index !== null);
}

function useDialogState() {
  const [showCreateBlockDialog, setShowCreateBlockDialog] = useState(false);
  const [isCreatingEmptyBlock, setIsCreatingEmptyBlock] = useState(false);
  const closeDialog = () => {
    setShowCreateBlockDialog(false);
    setIsCreatingEmptyBlock(false);
  };
  return {
    showCreateBlockDialog,
    isCreatingEmptyBlock,
    setShowCreateBlockDialog,
    setIsCreatingEmptyBlock,
    closeDialog,
  };
}

function createDeleteHandler(
  deleteAction: (blockId: string) => void,
  toast: ReturnType<typeof useToastContext>["toast"],
  undoDelete: (timestamp: number) => void
) {
  return (blockId: string) => {
    deleteAction(blockId);
    setTimeout(() => {
      const deletedSteps = useWorkoutStore.getState().deletedSteps;
      const mostRecentDelete = deletedSteps[deletedSteps.length - 1];
      if (mostRecentDelete) {
        toast({
          title: "Repetition block deleted",
          variant: "info",
          duration: 5000,
          action: (
            <button
              onClick={() => undoDelete(mostRecentDelete.timestamp)}
              className="px-3 py-1 text-sm font-medium rounded-md bg-white/10 hover:bg-white/20 transition-colors"
              data-testid="undo-delete-block-button"
            >
              Undo
            </button>
          ),
        });
      }
    }, 0);
  };
}

export function useRepetitionBlockHandlers() {
  const selectedStepIds = useSelectedStepIds();
  const createRepetitionBlock = useCreateRepetitionBlock();
  const createEmptyRepetitionBlock = useCreateEmptyRepetitionBlock();
  const editRepetitionBlock = useEditRepetitionBlock();
  const addStepToRepetitionBlock = useAddStepToRepetitionBlock();
  const duplicateStepInRepetitionBlock = useDuplicateStepInRepetitionBlock();
  const ungroupRepetitionBlock = useUngroupRepetitionBlock();
  const deleteRepetitionBlockAction = useDeleteRepetitionBlock();
  const undoDelete = useUndoDelete();
  const clearStepSelection = useClearStepSelection();
  const { toast } = useToastContext();
  const dialog = useDialogState();

  const handleDeleteRepetitionBlock = useCallback(
    createDeleteHandler(deleteRepetitionBlockAction, toast, undoDelete),
    [deleteRepetitionBlockAction, toast, undoDelete]
  );

  return {
    selectedStepIds,
    showCreateBlockDialog: dialog.showCreateBlockDialog,
    handleCreateRepetitionBlock: () => {
      dialog.setIsCreatingEmptyBlock(false);
      dialog.setShowCreateBlockDialog(true);
    },
    handleCreateEmptyRepetitionBlock: () => createEmptyRepetitionBlock(1),
    handleConfirmCreateBlock: (repeatCount: number) => {
      if (dialog.isCreatingEmptyBlock) {
        createEmptyRepetitionBlock(repeatCount);
      } else {
        const stepIndices = extractStepIndices(selectedStepIds);
        if (stepIndices.length >= 2) {
          createRepetitionBlock(stepIndices, repeatCount);
          clearStepSelection();
        }
      }
      dialog.closeDialog();
    },
    handleCancelCreateBlock: dialog.closeDialog,
    handleEditRepetitionBlock: editRepetitionBlock,
    handleAddStepToRepetitionBlock: addStepToRepetitionBlock,
    handleDuplicateStepInRepetitionBlock: duplicateStepInRepetitionBlock,
    handleUngroup: ungroupRepetitionBlock,
    handleDelete: handleDeleteRepetitionBlock,
  };
}
