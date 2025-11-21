import { Fragment } from "react";
import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { renderWorkoutItem } from "./render-workout-item";

type WorkoutListContentProps = {
  workout: Workout;
  selectedStepId?: string | null;
  selectedStepIds?: readonly string[];
  onStepSelect?: (stepId: string) => void;
  onToggleStepSelection?: (stepId: string) => void;
  onStepDelete?: (stepIndex: number) => void;
  onStepDuplicate?: (stepIndex: number) => void;
  onDuplicateStepInRepetitionBlock?: (
    blockIndex: number,
    stepIndex: number
  ) => void;
  onEditRepetitionBlock?: (blockIndex: number, repeatCount: number) => void;
  onAddStepToRepetitionBlock?: (blockIndex: number) => void;
  onReorderStepsInBlock?: (
    blockIndex: number,
    activeIndex: number,
    overIndex: number
  ) => void;
  generateStepId: (
    item: WorkoutStep | RepetitionBlock,
    index: number,
    parentBlockIndex?: number
  ) => string;
};

export const WorkoutListContent = ({
  workout,
  selectedStepId,
  selectedStepIds = [],
  onStepSelect,
  onToggleStepSelection,
  onStepDelete,
  onStepDuplicate,
  onDuplicateStepInRepetitionBlock,
  onEditRepetitionBlock,
  onAddStepToRepetitionBlock,
  onReorderStepsInBlock,
  generateStepId,
}: WorkoutListContentProps) => {
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
              onToggleStepSelection,
              onStepDelete,
              onStepDuplicate,
              onDuplicateStepInRepetitionBlock,
              onEditRepetitionBlock,
              onAddStepToRepetitionBlock,
              onReorderStepsInBlock,
              generateStepId,
            })}
          </Fragment>
        );
      })}
    </>
  );
};
