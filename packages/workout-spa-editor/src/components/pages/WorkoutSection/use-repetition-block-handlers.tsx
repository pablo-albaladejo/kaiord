import { useCallback } from "react";
import { executeDeleteWithToast } from "./delete-block-with-toast";
import { useToastContext } from "../../../contexts/ToastContext";
import {
  useAddStepToRepetitionBlock,
  useClearStepSelection,
  useCloseCreateBlockDialog,
  useCreateBlockDialogOpen,
  useCreateEmptyRepetitionBlock,
  useCreateRepetitionBlock,
  useDeleteRepetitionBlock,
  useDuplicateStepInRepetitionBlock,
  useEditRepetitionBlock,
  useOpenCreateBlockDialog,
  useSelectedStepIds,
  useShowConfirmationModal,
  useUndoDelete,
  useUngroupRepetitionBlock,
} from "../../../store/workout-store-selectors";

function extractStepIndices(ids: readonly string[]): Array<number> {
  return ids
    .map((id) => {
      const m = id.match(/^step-(\d+)$/);
      return m ? Number.parseInt(m[1], 10) : null;
    })
    .filter((i): i is number => i !== null);
}

function useDeleteWithConfirmation() {
  const deleteAction = useDeleteRepetitionBlock();
  const undoDelete = useUndoDelete();
  const showModal = useShowConfirmationModal();
  const { toast } = useToastContext();

  return useCallback(
    (blockId: string) => {
      showModal({
        title: "Delete Repetition Block",
        message:
          "Are you sure you want to delete this repetition block? This action can be undone.",
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        variant: "destructive",
        onConfirm: () => {
          executeDeleteWithToast(blockId, deleteAction, toast, undoDelete);
        },
      });
    },
    [deleteAction, toast, undoDelete, showModal]
  );
}

export function useRepetitionBlockHandlers() {
  const selectedStepIds = useSelectedStepIds();
  const createRepetitionBlock = useCreateRepetitionBlock();
  const createEmptyBlock = useCreateEmptyRepetitionBlock();
  const editRepetitionBlock = useEditRepetitionBlock();
  const addStep = useAddStepToRepetitionBlock();
  const duplicateStep = useDuplicateStepInRepetitionBlock();
  const ungroupBlock = useUngroupRepetitionBlock();
  const clearSelection = useClearStepSelection();
  const dialogOpen = useCreateBlockDialogOpen();
  const openDialog = useOpenCreateBlockDialog();
  const closeDialog = useCloseCreateBlockDialog();
  const handleDelete = useDeleteWithConfirmation();

  const handleConfirmCreateBlock = (repeatCount: number) => {
    const indices = extractStepIndices(selectedStepIds);
    if (indices.length >= 2) {
      createRepetitionBlock(indices, repeatCount);
      clearSelection();
    } else {
      createEmptyBlock(repeatCount);
    }
    closeDialog();
  };

  return {
    selectedStepIds,
    showCreateBlockDialog: dialogOpen,
    handleCreateRepetitionBlock: openDialog,
    handleCreateEmptyRepetitionBlock: () => createEmptyBlock(1),
    handleConfirmCreateBlock,
    handleCancelCreateBlock: closeDialog,
    handleEditRepetitionBlock: editRepetitionBlock,
    handleAddStepToRepetitionBlock: addStep,
    handleDuplicateStepInRepetitionBlock: duplicateStep,
    handleUngroup: ungroupBlock,
    handleDelete,
  };
}
