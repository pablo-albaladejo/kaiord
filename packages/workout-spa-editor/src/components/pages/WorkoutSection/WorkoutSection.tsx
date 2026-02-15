import { useWorkoutSectionState } from "./useWorkoutSectionState";
import { WorkoutHeader } from "./WorkoutHeader";
import { WorkoutSectionEditor } from "./WorkoutSectionEditor";
import { WorkoutStepsList } from "./WorkoutStepsList";
import { StoreConfirmationModal } from "../../molecules/ConfirmationModal";
import { CreateRepetitionBlockDialog } from "../../molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog";
import { WorkoutPreview } from "../../molecules/WorkoutPreview/WorkoutPreview";
import { WorkoutStats } from "../../organisms/WorkoutStats/WorkoutStats";
import type { KRD, Workout } from "../../../types/krd";

export type WorkoutSectionProps = {
  workout: Workout;
  krd: KRD;
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
  onStepReorder?: (activeIndex: number, overIndex: number) => void;
  onReorderStepsInBlock?: (
    blockId: string,
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
      <WorkoutPreview
        workout={props.workout}
        selectedStepId={props.selectedStepId}
        onStepSelect={props.onStepSelect}
      />
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
        onBlockSelect={state.handleBlockSelect}
        onToggleStepSelection={state.handleToggleStepSelection}
        onStepDelete={state.deleteStep}
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
      <CreateRepetitionBlockDialog
        stepCount={state.blockStepCount}
        onConfirm={state.handleConfirmCreateBlock}
        onCancel={state.handleCancelCreateBlock}
        isOpen={state.showCreateBlockDialog}
      />
      <StoreConfirmationModal />
    </div>
  );
}
