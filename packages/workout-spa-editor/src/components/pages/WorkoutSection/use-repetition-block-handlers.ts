import { useState } from "react";
import {
  useAddStepToRepetitionBlock,
  useClearStepSelection,
  useCreateEmptyRepetitionBlock,
  useCreateRepetitionBlock,
  useDuplicateStepInRepetitionBlock,
  useEditRepetitionBlock,
  useSelectedStepIds,
} from "../../../store/workout-store-selectors";
import { createPlaceholderHandlers } from "./repetition-block-placeholder-handlers";

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

export function useRepetitionBlockHandlers() {
  const selectedStepIds = useSelectedStepIds();
  const createRepetitionBlock = useCreateRepetitionBlock();
  const createEmptyRepetitionBlock = useCreateEmptyRepetitionBlock();
  const editRepetitionBlock = useEditRepetitionBlock();
  const addStepToRepetitionBlock = useAddStepToRepetitionBlock();
  const duplicateStepInRepetitionBlock = useDuplicateStepInRepetitionBlock();
  const clearStepSelection = useClearStepSelection();
  const dialog = useDialogState();
  const handleCreateRepetitionBlock = () => {
    dialog.setIsCreatingEmptyBlock(false);
    dialog.setShowCreateBlockDialog(true);
  };
  const handleCreateEmptyRepetitionBlock = () => {
    createEmptyRepetitionBlock(1);
  };
  const handleConfirmCreateBlock = (repeatCount: number) => {
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
  };
  const placeholders = createPlaceholderHandlers();
  return {
    selectedStepIds,
    showCreateBlockDialog: dialog.showCreateBlockDialog,
    handleCreateRepetitionBlock,
    handleCreateEmptyRepetitionBlock,
    handleConfirmCreateBlock,
    handleCancelCreateBlock: dialog.closeDialog,
    handleEditRepetitionBlock: editRepetitionBlock,
    handleAddStepToRepetitionBlock: addStepToRepetitionBlock,
    handleDuplicateStepInRepetitionBlock: duplicateStepInRepetitionBlock,
    handleUngroup: placeholders.handleUngroup,
    handleDelete: placeholders.handleDelete,
  };
}
