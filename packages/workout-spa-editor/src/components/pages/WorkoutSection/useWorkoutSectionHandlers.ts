import { useCallback } from "react";
import {
  useSelectStep,
  useSetEditing,
  useUpdateWorkout,
} from "../../../store/workout-store-selectors";
import type { KRD, Workout, WorkoutStep } from "../../../types/krd";
import { useDeleteHandlers } from "./useDeleteHandlers";
import {
  createUpdatedKrd,
  createUpdatedWorkout,
} from "./workout-section-handlers-helpers";

export const useWorkoutSectionHandlers = (
  workout: Workout,
  krd: KRD,
  onStepSelect: (stepIndex: number) => void
) => {
  const setEditing = useSetEditing();
  const selectStep = useSelectStep();
  const updateWorkout = useUpdateWorkout();
  const deleteHandlers = useDeleteHandlers();

  const handleStepSelect = useCallback(
    (stepIndex: number) => {
      onStepSelect(stepIndex);
      setEditing(true);
    },
    [onStepSelect, setEditing]
  );

  const handleSave = useCallback(
    (updatedStep: WorkoutStep) => {
      const updatedWorkout = createUpdatedWorkout(workout, updatedStep);
      const updatedKrd = createUpdatedKrd(krd, updatedWorkout);

      updateWorkout(updatedKrd);
      setEditing(false);
      selectStep(null);
    },
    [workout, krd, updateWorkout, setEditing, selectStep]
  );

  const handleCancel = useCallback(() => {
    setEditing(false);
    selectStep(null);
  }, [setEditing, selectStep]);

  return {
    handleStepSelect,
    handleSave,
    handleCancel,
    ...deleteHandlers,
  };
};
