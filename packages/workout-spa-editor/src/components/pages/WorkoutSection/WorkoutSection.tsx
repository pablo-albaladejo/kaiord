import {
  useCreateStep,
  useIsEditing,
} from "../../../store/workout-store-selectors";
import type { KRD, Workout } from "../../../types/krd";
import { DeleteConfirmDialog } from "../../molecules";
import { StepEditor } from "../../organisms/StepEditor/StepEditor";
import { WorkoutStats } from "../../organisms/WorkoutStats/WorkoutStats";
import { useSelectedStep } from "./useSelectedStep";
import { useWorkoutSectionHandlers } from "./useWorkoutSectionHandlers";
import { WorkoutHeader } from "./WorkoutHeader";
import { WorkoutStepsList } from "./WorkoutStepsList";

export type WorkoutSectionProps = {
  workout: Workout;
  krd: KRD;
  selectedStepId: string | null;
  onStepSelect: (stepIndex: number) => void;
};

/**
 * WorkoutSection Component
 *
 * Displays workout information, statistics, and step list.
 * Implements step editing flow when a step is selected.
 *
 * Requirements:
 * - Requirement 1: Display workout structure
 * - Requirement 3: Edit existing workout steps
 * - Requirement 9: Display workout statistics with real-time updates
 */
export function WorkoutSection({
  workout,
  krd,
  selectedStepId,
  onStepSelect,
}: WorkoutSectionProps) {
  const isEditing = useIsEditing();
  const createStep = useCreateStep();
  const selectedStep = useSelectedStep(selectedStepId, workout);
  const {
    handleStepSelect,
    handleSave,
    handleCancel,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
    stepToDelete,
  } = useWorkoutSectionHandlers(workout, krd, onStepSelect);

  return (
    <div className="space-y-6">
      <WorkoutHeader workout={workout} krd={krd} />

      <WorkoutStats workout={workout} />

      {isEditing && selectedStep && (
        <StepEditor
          step={selectedStep}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <WorkoutStepsList
        workout={workout}
        selectedStepId={selectedStepId}
        onStepSelect={handleStepSelect}
        onStepDelete={handleDeleteRequest}
        onAddStep={createStep}
      />

      {stepToDelete !== null && (
        <DeleteConfirmDialog
          stepIndex={stepToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}
