import {
  useCreateStep,
  useDuplicateStep,
  useIsEditing,
} from "../../../store/workout-store-selectors";
import type { KRD, Workout } from "../../../types/krd";
import { useSelectedStep } from "./useSelectedStep";
import { useWorkoutSectionHandlers } from "./useWorkoutSectionHandlers";

export function useWorkoutSectionState(
  workout: Workout,
  krd: KRD,
  selectedStepId: string | null,
  onStepSelect: (stepIndex: number) => void
) {
  const isEditing = useIsEditing();
  const createStep = useCreateStep();
  const duplicateStep = useDuplicateStep();
  const selectedStep = useSelectedStep(selectedStepId, workout);
  const handlers = useWorkoutSectionHandlers(workout, krd, onStepSelect);

  return {
    isEditing,
    createStep,
    duplicateStep,
    selectedStep,
    ...handlers,
  };
}
