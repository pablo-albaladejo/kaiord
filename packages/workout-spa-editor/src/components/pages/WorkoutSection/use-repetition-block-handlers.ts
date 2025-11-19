import { useState } from "react";
import {
  useAddStepToRepetitionBlock,
  useClearStepSelection,
  useCreateEmptyRepetitionBlock,
  useCreateRepetitionBlock,
  useEditRepetitionBlock,
  useSelectedStepIds,
} from "../../../store/workout-store-selectors";

export function useRepetitionBlockHandlers() {
  const selectedStepIds = useSelectedStepIds();
  const createRepetitionBlock = useCreateRepetitionBlock();
  const createEmptyRepetitionBlock = useCreateEmptyRepetitionBlock();
  const editRepetitionBlock = useEditRepetitionBlock();
  const addStepToRepetitionBlock = useAddStepToRepetitionBlock();
  const clearStepSelection = useClearStepSelection();
  const [showCreateBlockDialog, setShowCreateBlockDialog] = useState(false);
  const [isCreatingEmptyBlock, setIsCreatingEmptyBlock] = useState(false);

  const handleCreateRepetitionBlock = () => {
    setIsCreatingEmptyBlock(false);
    setShowCreateBlockDialog(true);
  };

  const handleCreateEmptyRepetitionBlock = () => {
    setIsCreatingEmptyBlock(true);
    setShowCreateBlockDialog(true);
  };

  const handleConfirmCreateBlock = (repeatCount: number) => {
    if (isCreatingEmptyBlock) {
      createEmptyRepetitionBlock(repeatCount);
    } else {
      const stepIndices = selectedStepIds
        .map((id) => {
          const match = id.match(/^step-(\d+)$/);
          return match ? Number.parseInt(match[1], 10) : null;
        })
        .filter((index): index is number => index !== null);

      if (stepIndices.length >= 2) {
        createRepetitionBlock(stepIndices, repeatCount);
        clearStepSelection();
      }
    }
    setShowCreateBlockDialog(false);
    setIsCreatingEmptyBlock(false);
  };

  const handleCancelCreateBlock = () => {
    setShowCreateBlockDialog(false);
    setIsCreatingEmptyBlock(false);
  };

  const handleEditRepetitionBlock = (
    blockIndex: number,
    repeatCount: number
  ) => {
    editRepetitionBlock(blockIndex, repeatCount);
  };

  const handleAddStepToRepetitionBlock = (blockIndex: number) => {
    addStepToRepetitionBlock(blockIndex);
  };

  return {
    selectedStepIds,
    showCreateBlockDialog,
    handleCreateRepetitionBlock,
    handleCreateEmptyRepetitionBlock,
    handleConfirmCreateBlock,
    handleCancelCreateBlock,
    handleEditRepetitionBlock,
    handleAddStepToRepetitionBlock,
  };
}
