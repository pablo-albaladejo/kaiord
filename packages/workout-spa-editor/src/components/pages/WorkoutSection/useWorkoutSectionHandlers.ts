import { useCallback } from "react";
import {
  useSelectStep,
  useSetEditing,
  useUpdateWorkout,
} from "../../../store/workout-store-selectors";
import type { KRD, Workout, WorkoutStep } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd";

export const useWorkoutSectionHandlers = (
  workout: Workout,
  krd: KRD,
  onStepSelect: (stepIndex: number) => void
) => {
  const setEditing = useSetEditing();
  const selectStep = useSelectStep();
  const updateWorkout = useUpdateWorkout();

  const handleStepSelect = useCallback(
    (stepIndex: number) => {
      onStepSelect(stepIndex);
      setEditing(true);
    },
    [onStepSelect, setEditing]
  );

  const handleSave = useCallback(
    (updatedStep: WorkoutStep) => {
      const updatedWorkout: Workout = {
        ...workout,
        steps: workout.steps.map((item) => {
          if (isRepetitionBlock(item)) {
            return {
              ...item,
              steps: item.steps.map((s) =>
                s.stepIndex === updatedStep.stepIndex ? updatedStep : s
              ),
            };
          }
          return item.stepIndex === updatedStep.stepIndex ? updatedStep : item;
        }),
      };

      const updatedKrd: KRD = {
        ...krd,
        extensions: {
          ...krd.extensions,
          workout: updatedWorkout,
        },
      };

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
  };
};
