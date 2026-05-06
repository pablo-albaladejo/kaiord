import { useCallback } from "react";

import { useToastContext } from "../../../contexts/ToastContext";
import { findById } from "../../../store/find-by-id";
import {
  useDeleteRepetitionBlock,
  useShowConfirmationModal,
  useUndoDelete,
} from "../../../store/selectors";
import type { Workout } from "../../../types/krd";
import { executeDeleteWithToast } from "./delete-block-with-toast";

/**
 * Resolve the selected ids — now stable ItemIds — to their main-list
 * array positions. Only top-level steps are candidates for wrapping into
 * a repetition block (nested-step / block selections are ignored).
 */
export function extractStepIndices(
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

export function useDeleteWithConfirmation() {
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

const MIN_STEPS_FOR_BLOCK = 2;

export type ConfirmCreateBlockDeps = {
  selectedStepIds: ReadonlyArray<string>;
  workout: Workout | undefined;
  createRepetitionBlock: (indices: Array<number>, repeatCount: number) => void;
  createEmptyBlock: (repeatCount: number) => void;
  clearSelection: () => void;
  closeDialog: () => void;
};

/**
 * Build the create-repetition-block confirm handler. Pure factory: the
 * caller wires deps from the hook scope; the returned function is what
 * the dialog's `onConfirm` invokes. Splitting this out keeps
 * `useRepetitionBlockHandlers` under the per-function line cap.
 */
export const buildHandleConfirmCreateBlock =
  (deps: ConfirmCreateBlockDeps) =>
  (repeatCount: number): void => {
    const { selectedStepIds, workout, closeDialog } = deps;
    // No workout but a selection exists — invariant broken; close the
    // dialog rather than silently swallowing the user's selection.
    if (!workout && selectedStepIds.length > 0) {
      closeDialog();
      return;
    }
    const indices = extractStepIndices(selectedStepIds, workout);
    if (indices.length >= MIN_STEPS_FOR_BLOCK) {
      deps.createRepetitionBlock(indices, repeatCount);
      deps.clearSelection();
    } else {
      deps.createEmptyBlock(repeatCount);
    }
    closeDialog();
  };
