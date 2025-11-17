import type { KRD, Workout } from "../../../types/krd";
import { DeleteConfirmDialog } from "../../molecules/DeleteConfirmDialog/DeleteConfirmDialog";
import { WorkoutStats } from "../../organisms/WorkoutStats/WorkoutStats";
import { useWorkoutSectionState } from "./useWorkoutSectionState";
import { WorkoutHeader } from "./WorkoutHeader";
import { WorkoutSectionEditor } from "./WorkoutSectionEditor";
import { WorkoutStepsList } from "./WorkoutStepsList";

export type WorkoutSectionProps = {
  workout: Workout;
  krd: KRD;
  selectedStepId: string | null;
  onStepSelect: (stepIndex: number) => void;
};

export function WorkoutSection(props: WorkoutSectionProps) {
  const state = useWorkoutSectionState(
    props.workout,
    props.krd,
    props.selectedStepId,
    props.onStepSelect
  );

  return (
    <div className="space-y-6" data-testid="workout-section">
      <WorkoutHeader workout={props.workout} krd={props.krd} />
      <WorkoutStats workout={props.workout} />
      <WorkoutSectionEditor
        isEditing={state.isEditing}
        selectedStep={state.selectedStep}
        onSave={state.handleSave}
        onCancel={state.handleCancel}
      />
      <WorkoutStepsList
        workout={props.workout}
        selectedStepId={props.selectedStepId}
        onStepSelect={state.handleStepSelect}
        onStepDelete={state.handleDeleteRequest}
        onStepDuplicate={state.duplicateStep}
        onAddStep={state.createStep}
      />
      {state.stepToDelete !== null && (
        <DeleteConfirmDialog
          stepIndex={state.stepToDelete}
          onConfirm={state.handleDeleteConfirm}
          onCancel={state.handleDeleteCancel}
        />
      )}
    </div>
  );
}
