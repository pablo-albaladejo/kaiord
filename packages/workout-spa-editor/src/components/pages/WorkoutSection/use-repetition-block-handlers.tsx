import { useCallback, useState } from "react";
import { executeDeleteWithToast } from "./delete-block-with-toast";
import { useToastContext } from "../../../contexts/ToastContext";
import {
  useAddStepToRepetitionBlock,
  useClearStepSelection,
  useCreateEmptyRepetitionBlock,
  useCreateRepetitionBlock,
  useDeleteRepetitionBlock,
  useDuplicateStepInRepetitionBlock,
  useEditRepetitionBlock,
  useHideConfirmationModal,
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

function useDialogState() {
  const [open, setOpen] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const close = () => {
    setOpen(false);
    setIsEmpty(false);
  };
  return { open, isEmpty, setOpen, setIsEmpty, close };
}

function useDeleteWithConfirmation() {
  const deleteAction = useDeleteRepetitionBlock();
  const undoDelete = useUndoDelete();
  const showModal = useShowConfirmationModal();
  const hideModal = useHideConfirmationModal();
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
          hideModal();
          executeDeleteWithToast(blockId, deleteAction, toast, undoDelete);
        },
        onCancel: () => hideModal(),
      });
    },
    [deleteAction, toast, undoDelete, showModal, hideModal]
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
  const dialog = useDialogState();
  const handleDelete = useDeleteWithConfirmation();

  const handleConfirmCreateBlock = (repeatCount: number) => {
    if (dialog.isEmpty) {
      createEmptyBlock(repeatCount);
    } else {
      const indices = extractStepIndices(selectedStepIds);
      if (indices.length >= 2) {
        createRepetitionBlock(indices, repeatCount);
        clearSelection();
      }
    }
    dialog.close();
  };

  return {
    selectedStepIds,
    showCreateBlockDialog: dialog.open,
    handleCreateRepetitionBlock: () => {
      dialog.setIsEmpty(false);
      dialog.setOpen(true);
    },
    handleCreateEmptyRepetitionBlock: () => createEmptyBlock(1),
    handleConfirmCreateBlock,
    handleCancelCreateBlock: dialog.close,
    handleEditRepetitionBlock: editRepetitionBlock,
    handleAddStepToRepetitionBlock: addStep,
    handleDuplicateStepInRepetitionBlock: duplicateStep,
    handleUngroup: ungroupBlock,
    handleDelete,
  };
}
