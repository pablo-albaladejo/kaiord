/**
 * App Handlers Hook
 *
 * Custom hook that provides event handlers for the main App component.
 */

import { useLoadWorkout, useSelectStep } from "../store/selectors";
import { useWorkoutStore } from "../store/workout-store";
import type { KRD } from "../types/krd";
import type { Sport } from "../types/krd-core";

export const useAppHandlers = () => {
  const loadWorkout = useLoadWorkout();
  const selectStep = useSelectStep();
  const createEmptyWorkout = useWorkoutStore(
    (state) => state.createEmptyWorkout
  );

  const handleFileLoad = (krd: KRD) => {
    loadWorkout(krd);
  };

  const handleFileError = () => {
    // Error handling is done by FileUpload component
  };

  const handleStepSelect = (stepId: string) => {
    selectStep(stepId);
  };

  const handleCreateWorkout = (name: string, sport: Sport) => {
    createEmptyWorkout(name, sport);
  };

  return {
    handleFileLoad,
    handleFileError,
    handleStepSelect,
    handleCreateWorkout,
  };
};
