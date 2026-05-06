import {
  useAddStepToRepetitionBlock,
  useClearStepSelection,
  useCloseCreateBlockDialog,
  useCreateBlockDialogOpen,
  useCreateEmptyRepetitionBlock,
  useCreateRepetitionBlock,
  useCurrentWorkout,
  useDuplicateStepInRepetitionBlock,
  useEditRepetitionBlock,
  useOpenCreateBlockDialog,
  useSelectedStepIds,
  useUngroupRepetitionBlock,
} from "../../../store/workout-store-selectors";
import type { Workout } from "../../../types/krd";
import {
  buildHandleConfirmCreateBlock,
  useDeleteWithConfirmation,
} from "./use-repetition-block-handlers.helpers";

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

  const workout = currentWorkout?.extensions?.structured_workout as
    | Workout
    | undefined;
  const handleConfirmCreateBlock = buildHandleConfirmCreateBlock({
    selectedStepIds,
    workout,
    createRepetitionBlock,
    createEmptyBlock,
    clearSelection,
    closeDialog,
  });

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
