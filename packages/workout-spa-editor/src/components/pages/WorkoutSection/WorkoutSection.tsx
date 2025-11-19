import type { KRD, Workout } from "../../../types/krd";
import { CreateRepetitionBlockDialog } from "../../molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog";
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
        selectedStepIds={state.selectedStepIds}
        onStepSelect={state.handleStepSelect}
        onToggleStepSelection={state.handleToggleStepSelection}
        onStepDelete={state.handleDeleteRequest}
        onStepDuplicate={state.duplicateStep}
        onAddStep={state.createStep}
        onCreateRepetitionBlock={state.handleCreateRepetitionBlock}
        onCreateEmptyRepetitionBlock={state.handleCreateEmptyRepetitionBlock}
        onEditRepetitionBlock={state.handleEditRepetitionBlock}
        onAddStepToRepetitionBlock={state.handleAddStepToRepetitionBlock}
        onDuplicateStepInRepetitionBlock={
          state.handleDuplicateStepInRepetitionBlock
        }
      />
      {state.stepToDelete !== null && (
        <DeleteConfirmDialog
          stepIndex={state.stepToDelete}
          onConfirm={state.handleDeleteConfirm}
          onCancel={state.handleDeleteCancel}
        />
      )}
      {state.showCreateBlockDialog && (
        <CreateRepetitionBlockDialog
          stepCount={
            state.selectedStepIds.length >= 2
              ? state.selectedStepIds.length
              : undefined
          }
          onConfirm={state.handleConfirmCreateBlock}
          onCancel={state.handleCancelCreateBlock}
        />
      )}
    </div>
  );
}
