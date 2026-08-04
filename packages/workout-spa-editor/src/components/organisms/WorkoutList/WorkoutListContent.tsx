import { Fragment } from "react";

import { EmptyWorkoutState } from "../../molecules/EmptyWorkoutState";
import { renderWorkoutItem } from "./render-workout-item";
import type { WorkoutListContentProps } from "./WorkoutListContent.types";

export const WorkoutListContent = ({
  workout,
  selectedStepId,
  selectedStepIds = [],
  onStepSelect,
  onBlockSelect,
  onToggleStepSelection,
  onStepDelete,
  onStepDuplicate,
  onStepCopy,
  onDuplicateStepInRepetitionBlock,
  onDeleteStepInRepetitionBlock,
  onEditRepetitionBlock,
  onAddStepToRepetitionBlock,
  onUngroupRepetitionBlock,
  onDeleteRepetitionBlock,
  onReorderStepsInBlock,
  generateStepId,
  onAddStep,
  renderAfterItem,
}: WorkoutListContentProps) => {
  if (workout.steps.length === 0 && onAddStep) {
    return <EmptyWorkoutState onAddStep={onAddStep} />;
  }

  return (
    <>
      {workout.steps.map((item, index) => {
        const itemId = generateStepId(item, index);
        return (
          <Fragment key={itemId}>
            {renderWorkoutItem({
              item,
              index,
              itemId,
              selectedStepId,
              selectedStepIds,
              onStepSelect,
              onBlockSelect,
              onToggleStepSelection,
              onStepDelete,
              onStepDuplicate,
              onStepCopy,
              onDuplicateStepInRepetitionBlock,
              onDeleteStepInRepetitionBlock,
              onEditRepetitionBlock,
              onAddStepToRepetitionBlock,
              onUngroupRepetitionBlock,
              onDeleteRepetitionBlock,
              onReorderStepsInBlock,
              generateStepId,
            })}
            {renderAfterItem?.(itemId)}
          </Fragment>
        );
      })}
    </>
  );
};
