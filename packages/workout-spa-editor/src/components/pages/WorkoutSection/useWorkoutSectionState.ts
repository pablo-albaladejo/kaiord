import { useState } from "react";
import {
  useAddStepToRepetitionBlock,
  useClearStepSelection,
  useCreateRepetitionBlock,
  useCreateStep,
  useDuplicateStep,
  useEditRepetitionBlock,
  useIsEditing,
  useSelectedStepIds,
  useToggleStepSelection,
} from "../../../store/workout-store-selectors";
import type { KRD, Workout } from "../../../types/krd";
import { useSelectedStep } from "./useSelectedStep";
import { useWorkoutSectionHandlers } from "./useWorkoutSectionHandlers";

export function useWorkoutSectionState(
  workout: Workout,
  krd: KRD,
  selectedStepId: string | null,
  onStepSelect: (stepIndex: number) => void
) {
  const isEditing = useIsEditing();
  const createStep = useCreateStep();
  const duplicateStep = useDuplicateStep();
  const selectedStep = useSelectedStep(selectedStepId, workout);
  const handlers = useWorkoutSectionHandlers(workout, krd, onStepSelect);

  const selectedStepIds = useSelectedStepIds();
  const toggleStepSelection = useToggleStepSelection();
  const clearStepSelection = useClearStepSelection();
  const createRepetitionBlock = useCreateRepetitionBlock();
  const editRepetitionBlock = useEditRepetitionBlock();
  const addStepToRepetitionBlock = useAddStepToRepetitionBlock();
  const [showCreateBlockDialog, setShowCreateBlockDialog] = useState(false);

  const handleToggleStepSelection = (stepIndex: number) => {
    toggleStepSelection(`step-${stepIndex}`);
  };

  const handleCreateRepetitionBlock = () => {
    setShowCreateBlockDialog(true);
  };

  const handleConfirmCreateBlock = (repeatCount: number) => {
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
    setShowCreateBlockDialog(false);
  };

  const handleCancelCreateBlock = () => {
    setShowCreateBlockDialog(false);
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
    isEditing,
    createStep,
    duplicateStep,
    selectedStep,
    selectedStepIds,
    showCreateBlockDialog,
    handleToggleStepSelection,
    handleCreateRepetitionBlock,
    handleConfirmCreateBlock,
    handleCancelCreateBlock,
    handleEditRepetitionBlock,
    handleAddStepToRepetitionBlock,
    ...handlers,
  };
}
