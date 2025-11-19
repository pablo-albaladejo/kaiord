import type { HTMLAttributes } from "react";
import type { Workout } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd";
import { renderRepetitionBlock, renderStep } from "./WorkoutListItem";

export type WorkoutListProps = HTMLAttributes<HTMLDivElement> & {
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
};

export const WorkoutList = ({
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
  className = "",
  ...props
}: WorkoutListProps) => {
  const baseClasses = "flex flex-col gap-4";
  const classes = [baseClasses, className].filter(Boolean).join(" ");

  return (
    <div className={classes} role="list" aria-label="Workout steps" {...props}>
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
          });
        }
        return renderStep({
          step: item,
          selectedStepId,
          selectedStepIds,
          onStepSelect,
          onToggleStepSelection,
          onStepDelete,
          onStepDuplicate,
        });
      })}
    </div>
  );
};
