import type { HTMLAttributes } from "react";
import type { Workout } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd";
import { renderRepetitionBlock, renderStep } from "./WorkoutListItem";

export type WorkoutListProps = HTMLAttributes<HTMLDivElement> & {
  workout: Workout;
  selectedStepId?: string | null;
  onStepSelect?: (stepIndex: number) => void;
  onStepDelete?: (stepIndex: number) => void;
  onStepDuplicate?: (stepIndex: number) => void;
};

export const WorkoutList = ({
  workout,
  selectedStepId,
  onStepSelect,
  onStepDelete,
  onStepDuplicate,
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
            onStepDuplicate,
          });
        }
        return renderStep({
          step: item,
          selectedStepId,
          onStepSelect,
          onStepDelete,
          onStepDuplicate,
        });
      })}
    </div>
  );
};
