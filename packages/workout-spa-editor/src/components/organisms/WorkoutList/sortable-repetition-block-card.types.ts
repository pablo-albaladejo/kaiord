import type { RepetitionBlock, WorkoutStep } from "../../../types/krd";

export type SortableRepetitionBlockCardProps = {
  id: string;
  block: RepetitionBlock;
  blockIndex: number;
  selectedStepId?: string | null;
  selectedStepIds?: readonly string[];
  onStepSelect?: (stepId: string) => void;
  onBlockSelect?: (blockId: string) => void;
  onToggleStepSelection?: (stepId: string) => void;
  onStepDelete?: (stepIndex: number) => void;
  onStepDuplicate?: (blockIndex: number, stepIndex: number) => void;
  onEditRepeatCount?: (count: number) => void;
  onAddStep?: () => void;
  onUngroup?: () => void;
  onDelete?: () => void;
  onReorderSteps?: (
    blockIndex: number,
    activeIndex: number,
    overIndex: number
  ) => void;
  generateStepId?: (
    item: WorkoutStep | RepetitionBlock,
    index: number,
    parentBlockIndex?: number
  ) => string;
  parentBlockIndex: number;
};
