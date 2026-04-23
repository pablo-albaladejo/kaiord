/**
 * Thin adapter between the `useWorkoutSectionState` action bundle and
 * the prop-heavy `WorkoutStepsList`. Lives in its own file so
 * `WorkoutSectionInner` stays under the 60-line function limit.
 */

import type { RefObject } from "react";

import type { Workout } from "../../../types/krd";
import type { useWorkoutSectionState } from "./useWorkoutSectionState";
import { WorkoutStepsList } from "./WorkoutStepsList";

type State = ReturnType<typeof useWorkoutSectionState>;

type WorkoutStepsListBindingProps = {
  workout: Workout;
  selectedStepId: string | null;
  state: State;
  editorRootRef: RefObject<HTMLDivElement | null>;
  addStepButtonRef: RefObject<HTMLButtonElement | null>;
};

export function WorkoutStepsListBinding({
  workout,
  selectedStepId,
  state,
  editorRootRef,
  addStepButtonRef,
}: WorkoutStepsListBindingProps) {
  return (
    <WorkoutStepsList
      workout={workout}
      selectedStepId={selectedStepId}
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
      editorRootRef={editorRootRef}
      addStepButtonRef={addStepButtonRef}
    />
  );
}
