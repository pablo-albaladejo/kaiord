import { Fragment } from "react";
import { renderWorkoutItem } from "./render-workout-item";
import { EmptyWorkoutState } from "../../molecules/EmptyWorkoutState";
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
  onEditRepetitionBlock,
  onAddStepToRepetitionBlock,
  onUngroupRepetitionBlock,
  onDeleteRepetitionBlock,
  onReorderStepsInBlock,
  generateStepId,
  onAddStep,
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
              onEditRepetitionBlock,
              onAddStepToRepetitionBlock,
              onUngroupRepetitionBlock,
              onDeleteRepetitionBlock,
              onReorderStepsInBlock,
              generateStepId,
            })}
          </Fragment>
        );
      })}
    </>
  );
};
