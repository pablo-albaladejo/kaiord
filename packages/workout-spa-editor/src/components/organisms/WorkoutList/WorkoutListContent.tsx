import type { Workout } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd";
import { renderRepetitionBlock, renderStep } from "./WorkoutListItem";

type WorkoutListContentProps = {
  workout: Workout;
  selectedStepId?: string | null;
  selectedStepIds?: readonly string[];
  onStepSelect?: (stepIndex: number) => void;
  onToggleStepSelection?: (stepIndex: number) => void;
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
}: WorkoutListContentProps) => {
  return (
    <>
      {workout.steps.map((item, index) => {
        if (isRepetitionBlock(item)) {
          return renderRepetitionBlock({
            block: item,
            blockIndex: index,
            selectedStepId,
            onStepSelect,
            onStepDelete,
            onStepDuplicate: onDuplicateStepInRepetitionBlock,
            onEditRepeatCount: onEditRepetitionBlock
              ? (count: number) => onEditRepetitionBlock(index, count)
              : undefined,
            onAddStep: onAddStepToRepetitionBlock
              ? () => onAddStepToRepetitionBlock(index)
              : undefined,
            onReorderSteps: onReorderStepsInBlock,
          });
        }
        return renderStep({
          step: item,
          index,
          selectedStepId,
          selectedStepIds,
          onStepSelect,
          onToggleStepSelection,
          onStepDelete,
          onStepDuplicate,
        });
      })}
    </>
  );
};
