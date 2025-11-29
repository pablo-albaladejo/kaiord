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
  onStepSelect: (stepId: string) => void;
  onStepReorder?: (activeIndex: number, overIndex: number) => void;
  onReorderStepsInBlock?: (
    blockIndex: number,
    activeIndex: number,
    overIndex: number
  ) => void;
};

export function WorkoutSection(props: WorkoutSectionProps) {
  const state = useWorkoutSectionState(
    props.workout,
    props.krd,
    props.selectedStepId,
    props.onStepSelect,
    props.onStepReorder,
    props.onReorderStepsInBlock
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
        onStepCopy={state.copyStep}
        onStepPaste={state.pasteStep}
        onStepReorder={state.reorderStep}
        onReorderStepsInBlock={state.reorderStepsInBlock}
        onAddStep={state.createStep}
        onCreateRepetitionBlock={state.handleCreateRepetitionBlock}
        onCreateEmptyRepetitionBlock={state.handleCreateEmptyRepetitionBlock}
        onEditRepetitionBlock={state.handleEditRepetitionBlock}
        onAddStepToRepetitionBlock={state.handleAddStepToRepetitionBlock}
        onUngroupRepetitionBlock={state.handleUngroupRepetitionBlock}
        onDeleteRepetitionBlock={state.handleDeleteRepetitionBlock}
        onDuplicateStepInRepetitionBlock={
          state.handleDuplicateStepInRepetitionBlock
        }
      />
      <DeleteConfirmDialog
        stepIndex={state.stepToDelete}
        onConfirm={state.handleDeleteConfirm}
        onCancel={state.handleDeleteCancel}
      />
      <CreateRepetitionBlockDialog
        stepCount={
          state.selectedStepIds.length >= 2
            ? state.selectedStepIds.length
            : undefined
        }
        onConfirm={state.handleConfirmCreateBlock}
        onCancel={state.handleCancelCreateBlock}
        isOpen={state.showCreateBlockDialog}
      />
    </div>
  );
}
