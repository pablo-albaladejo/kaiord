import { useCopyStep } from "../components/pages/WorkoutSection/useCopyStep";
import { usePasteStep } from "../components/pages/WorkoutSection/usePasteStep";
import { useWorkoutStore } from "../store/workout-store";
import {
  useCurrentWorkout,
  useSelectedStepId,
  useSelectedStepIds,
} from "../store/workout-store-selectors";

export function useContextMenuStore() {
  const currentWorkout = useCurrentWorkout();
  const selectedStepId = useSelectedStepId();
  const selectedStepIds = useSelectedStepIds();
  const selectStep = useWorkoutStore((s) => s.selectStep);
  const clearStepSelection = useWorkoutStore((s) => s.clearStepSelection);
  const deleteStep = useWorkoutStore((s) => s.deleteStep);
  const copyStep = useCopyStep();
  const pasteStep = usePasteStep();
  const openCreateBlockDialog = useWorkoutStore((s) => s.openCreateBlockDialog);
  const ungroupRepetitionBlock = useWorkoutStore(
    (s) => s.ungroupRepetitionBlock
  );
  const selectAllSteps = useWorkoutStore((s) => s.selectAllSteps);
  const undo = useWorkoutStore((s) => s.undo);
  const redo = useWorkoutStore((s) => s.redo);
  const canUndo = useWorkoutStore((s) => s.canUndo());
  const canRedo = useWorkoutStore((s) => s.canRedo());
  const reorderStep = useWorkoutStore((s) => s.reorderStep);

  return {
    currentWorkout,
    selectedStepId,
    selectedStepIds,
    selectStep,
    clearStepSelection,
    deleteStep,
    copyStep,
    pasteStep,
    openCreateBlockDialog,
    ungroupRepetitionBlock,
    selectAllSteps,
    undo,
    redo,
    canUndo,
    canRedo,
    reorderStep,
  };
}
