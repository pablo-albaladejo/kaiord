import {
  useCreateStep,
  useDuplicateStep,
  useIsEditing,
  useReorderStep,
  useSelectStep,
  useToggleStepSelection,
} from "../../../store/selectors";
import type { KRD, Workout } from "../../../types/krd";
import { useDeleteStepWithToast } from "./use-delete-step-with-toast";
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
  const deleteStep = useDeleteStepWithToast();
  const duplicateStep = useDuplicateStep();
  const copyStep = useCopyStep();
  const pasteStep = usePasteStep();
  const defaultReorderStep = useReorderStep();
  const reorderStep = onStepReorder || defaultReorderStep;
  const selectedStep = useSelectedStep(selectedStepId, workout);
  const handlers = useWorkoutSectionHandlers(workout, krd, onStepSelect);

  const toggleStepSelection = useToggleStepSelection();
  const selectStep = useSelectStep();
  const blocks = useRepetitionBlockHandlers();
  const { selectedStepIds } = blocks;

  return {
    isEditing,
    blockStepCount:
      selectedStepIds.length >= 2 ? selectedStepIds.length : undefined,
    createStep,
    deleteStep,
    duplicateStep,
    copyStep,
    pasteStep,
    reorderStep,
    reorderStepsInBlock: onReorderStepsInBlock,
    selectedStep,
    selectedStepIds,
    showCreateBlockDialog: blocks.showCreateBlockDialog,
    handleBlockSelect: selectStep,
    handleToggleStepSelection: toggleStepSelection,
    handleCreateRepetitionBlock: blocks.handleCreateRepetitionBlock,
    handleCreateEmptyRepetitionBlock: blocks.handleCreateEmptyRepetitionBlock,
    handleConfirmCreateBlock: blocks.handleConfirmCreateBlock,
    handleCancelCreateBlock: blocks.handleCancelCreateBlock,
    handleEditRepetitionBlock: blocks.handleEditRepetitionBlock,
    handleAddStepToRepetitionBlock: blocks.handleAddStepToRepetitionBlock,
    handleUngroupRepetitionBlock: blocks.handleUngroup,
    handleDeleteRepetitionBlock: blocks.handleDelete,
    handleDuplicateStepInRepetitionBlock:
      blocks.handleDuplicateStepInRepetitionBlock,
    handleDeleteStepInRepetitionBlock: blocks.handleDeleteStepInRepetitionBlock,
    ...handlers,
  };
}
