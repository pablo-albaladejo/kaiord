import { useDeleteStepWithToast } from "./use-delete-step-with-toast";
import { useRepetitionBlockHandlers } from "./use-repetition-block-handlers";
import { useCopyStep } from "./useCopyStep";
import { usePasteStep } from "./usePasteStep";
import { useSelectedStep } from "./useSelectedStep";
import { useWorkoutSectionHandlers } from "./useWorkoutSectionHandlers";
import {
  useCreateStep,
  useDuplicateStep,
  useIsEditing,
  useReorderStep,
  useSelectStep,
  useToggleStepSelection,
} from "../../../store/workout-store-selectors";
import type { KRD, Workout } from "../../../types/krd";

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
  const repetitionBlockHandlers = useRepetitionBlockHandlers();
  const { selectedStepIds } = repetitionBlockHandlers;

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
    showCreateBlockDialog: repetitionBlockHandlers.showCreateBlockDialog,
    handleBlockSelect: selectStep,
    handleToggleStepSelection: toggleStepSelection,
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
