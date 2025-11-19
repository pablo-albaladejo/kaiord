import {
  useCreateStep,
  useDuplicateStep,
  useIsEditing,
  useReorderStep,
  useToggleStepSelection,
} from "../../../store/workout-store-selectors";
import type { KRD, Workout } from "../../../types/krd";
import { useRepetitionBlockHandlers } from "./use-repetition-block-handlers";
import { useSelectedStep } from "./useSelectedStep";
import { useWorkoutSectionHandlers } from "./useWorkoutSectionHandlers";

export function useWorkoutSectionState(
  workout: Workout,
  krd: KRD,
  selectedStepId: string | null,
  onStepSelect: (stepIndex: number) => void,
  onStepReorder?: (activeIndex: number, overIndex: number) => void,
  onReorderStepsInBlock?: (
    blockIndex: number,
    activeIndex: number,
    overIndex: number
  ) => void
) {
  const isEditing = useIsEditing();
  const createStep = useCreateStep();
  const duplicateStep = useDuplicateStep();
  const reorderStep = onStepReorder || useReorderStep();
  const selectedStep = useSelectedStep(selectedStepId, workout);
  const handlers = useWorkoutSectionHandlers(workout, krd, onStepSelect);

  const toggleStepSelection = useToggleStepSelection();
  const repetitionBlockHandlers = useRepetitionBlockHandlers();

  const handleToggleStepSelection = (stepIndex: number) => {
    toggleStepSelection(`step-${stepIndex}`);
  };

  return {
    isEditing,
    createStep,
    duplicateStep,
    reorderStep,
    reorderStepsInBlock: onReorderStepsInBlock,
    selectedStep,
    selectedStepIds: repetitionBlockHandlers.selectedStepIds,
    showCreateBlockDialog: repetitionBlockHandlers.showCreateBlockDialog,
    handleToggleStepSelection,
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
    handleDuplicateStepInRepetitionBlock:
      repetitionBlockHandlers.handleDuplicateStepInRepetitionBlock,
    ...handlers,
  };
}
