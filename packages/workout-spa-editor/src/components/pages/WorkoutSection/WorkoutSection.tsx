import {
  useCreateStep,
  useDuplicateStep,
  useIsEditing,
} from "../../../store/workout-store-selectors";
import type { KRD, Workout } from "../../../types/krd";
import { DeleteConfirmDialog } from "../../molecules";
import { WorkoutStats } from "../../organisms/WorkoutStats/WorkoutStats";
import { useSelectedStep } from "./useSelectedStep";
import { useWorkoutSectionHandlers } from "./useWorkoutSectionHandlers";
import { WorkoutHeader } from "./WorkoutHeader";
import { WorkoutSectionEditor } from "./WorkoutSectionEditor";
import { WorkoutStepsList } from "./WorkoutStepsList";

export type WorkoutSectionProps = {
  workout: Workout;
  krd: KRD;
  selectedStepId: string | null;
  onStepSelect: (stepIndex: number) => void;
};

export function WorkoutSection({
  workout,
  krd,
  selectedStepId,
  onStepSelect,
}: WorkoutSectionProps) {
  const isEditing = useIsEditing();
  const createStep = useCreateStep();
  const duplicateStep = useDuplicateStep();
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
      <WorkoutSectionEditor
        isEditing={isEditing}
        selectedStep={selectedStep}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      <WorkoutStepsList
        workout={workout}
        selectedStepId={selectedStepId}
        onStepSelect={handleStepSelect}
        onStepDelete={handleDeleteRequest}
        onStepDuplicate={duplicateStep}
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
