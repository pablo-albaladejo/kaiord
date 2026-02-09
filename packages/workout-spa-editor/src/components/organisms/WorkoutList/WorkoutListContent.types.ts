import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";

export type WorkoutListContentProps = {
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
  onReorderStepsInBlock?: (
    blockId: string,
    activeIndex: number,
    overIndex: number
  ) => void;
  generateStepId: (
    item: WorkoutStep | RepetitionBlock,
    index: number,
    parentBlockIndex?: number
  ) => string;
  onAddStep?: () => void;
};
