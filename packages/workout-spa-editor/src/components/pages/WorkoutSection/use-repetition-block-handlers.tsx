import {
  useAddStepToRepetitionBlock,
  useClearStepSelection,
  useCloseCreateBlockDialog,
  useCreateBlockDialogOpen,
  useCreateEmptyRepetitionBlock,
  useCreateRepetitionBlock,
  useCurrentWorkout,
  useDeleteStepInRepetitionBlock,
  useDuplicateStepInRepetitionBlock,
  useEditRepetitionBlock,
  useOpenCreateBlockDialog,
  useSelectedStepIds,
  useUngroupRepetitionBlock,
} from "../../../store/selectors";
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
  // Deliberately the raw store action, not `useDeleteStepWithToast`:
  // that hook reads the `deletedSteps` undo trail, which block-scoped
  // deletes do not write (see delete-step-in-repetition-block-action).
  const deleteStepInBlock = useDeleteStepInRepetitionBlock();
  const ungroupBlock = useUngroupRepetitionBlock();
  const clearSelection = useClearStepSelection();
  const dialogOpen = useCreateBlockDialogOpen();
  const openDialog = useOpenCreateBlockDialog();
  const closeDialog = useCloseCreateBlockDialog();
  const handleDelete = useDeleteWithConfirmation();

  const workout = currentWorkout?.extensions?.structured_workout as
    Workout | undefined;
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
    handleDeleteStepInRepetitionBlock: deleteStepInBlock,
    handleUngroup: ungroupBlock,
    handleDelete,
  };
}
