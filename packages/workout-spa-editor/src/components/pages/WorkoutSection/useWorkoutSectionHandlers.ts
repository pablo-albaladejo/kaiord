import { useCallback } from "react";
import {
  createUpdatedKrd,
  createUpdatedWorkout,
} from "./workout-section-handlers-helpers";
import {
  useSelectStep,
  useSelectedStepId,
  useSetEditing,
  useUpdateWorkout,
} from "../../../store/workout-store-selectors";
import type { KRD, Workout, WorkoutStep } from "../../../types/krd";

export const useWorkoutSectionHandlers = (
  workout: Workout,
  krd: KRD,
  onStepSelect: (stepId: string) => void
) => {
  const setEditing = useSetEditing();
  const selectStep = useSelectStep();
  const selectedStepId = useSelectedStepId();
  const updateWorkout = useUpdateWorkout();

  const handleStepSelect = useCallback(
    (stepId: string) => {
      onStepSelect(stepId);
      setEditing(true);
    },
    [onStepSelect, setEditing]
  );

  const handleSave = useCallback(
    (updatedStep: WorkoutStep) => {
      const updatedWorkout = createUpdatedWorkout(
        workout,
        updatedStep,
        selectedStepId
      );
      const updatedKrd = createUpdatedKrd(krd, updatedWorkout);

      updateWorkout(updatedKrd);
      setEditing(false);
      selectStep(null);
    },
    [workout, krd, selectedStepId, updateWorkout, setEditing, selectStep]
  );

  const handleCancel = useCallback(() => {
    setEditing(false);
    selectStep(null);
  }, [setEditing, selectStep]);

  return {
    handleStepSelect,
    handleSave,
    handleCancel,
  };
};
