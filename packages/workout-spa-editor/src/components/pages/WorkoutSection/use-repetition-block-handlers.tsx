import { useCallback } from "react";

import { useToastContext } from "../../../contexts/ToastContext";
import { findById } from "../../../store/find-by-id";
import {
  useAddStepToRepetitionBlock,
  useClearStepSelection,
  useCloseCreateBlockDialog,
  useCreateBlockDialogOpen,
  useCreateEmptyRepetitionBlock,
  useCreateRepetitionBlock,
  useCurrentWorkout,
  useDeleteRepetitionBlock,
  useDuplicateStepInRepetitionBlock,
  useEditRepetitionBlock,
  useOpenCreateBlockDialog,
  useSelectedStepIds,
  useShowConfirmationModal,
  useUndoDelete,
  useUngroupRepetitionBlock,
} from "../../../store/workout-store-selectors";
import type { Workout } from "../../../types/krd";
import { executeDeleteWithToast } from "./delete-block-with-toast";

/**
 * Resolve the selected ids — now stable ItemIds — to their main-list
 * array positions. Only top-level steps are candidates for wrapping into
 * a repetition block (nested-step / block selections are ignored).
 */
function extractStepIndices(
  ids: readonly string[],
  workout: Workout | undefined
): Array<number> {
  if (!workout) return [];
  return ids
    .map((id) => {
      const found = findById(workout, id);
      return found?.kind === "step" ? found.index : null;
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
  const currentWorkout = useCurrentWorkout();
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
    const workout = currentWorkout?.extensions?.structured_workout as
      | Workout
      | undefined;
    const indices = extractStepIndices(selectedStepIds, workout);
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
