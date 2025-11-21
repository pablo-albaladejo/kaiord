import type { HTMLAttributes } from "react";
import type { Workout } from "../../../types/krd";

export type WorkoutListProps = HTMLAttributes<HTMLDivElement> & {
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
  onStepReorder?: (activeIndex: number, overIndex: number) => void;
  onReorderStepsInBlock?: (
    blockIndex: number,
    activeIndex: number,
    overIndex: number
  ) => void;
};
