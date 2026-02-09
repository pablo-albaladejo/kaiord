import type { Workout } from "../../../types/krd";
import type { HTMLAttributes } from "react";

export type WorkoutListProps = HTMLAttributes<HTMLDivElement> & {
  workout: Workout;
  selectedStepId?: string | null;
  selectedStepIds?: readonly string[];
  onStepSelect?: (stepId: string) => void;
  onBlockSelect?: (blockId: string) => void;
  onToggleStepSelection?: (stepId: string) => void;
  onStepDelete?: (stepIndex: number) => void;
  onStepDuplicate?: (stepIndex: number) => void;
  onStepCopy?: (stepIndex: number) => void;
  onDuplicateStepInRepetitionBlock?: (
    blockId: string,
    stepIndex: number
  ) => void;
  onEditRepetitionBlock?: (blockId: string, repeatCount: number) => void;
  onAddStepToRepetitionBlock?: (blockId: string) => void;
  onUngroupRepetitionBlock?: (blockId: string) => void;
  onDeleteRepetitionBlock?: (blockId: string) => void;
  onStepReorder?: (activeIndex: number, overIndex: number) => void;
  onReorderStepsInBlock?: (
    blockId: string,
    activeIndex: number,
    overIndex: number
  ) => void;
  onAddStep?: () => void;
};
