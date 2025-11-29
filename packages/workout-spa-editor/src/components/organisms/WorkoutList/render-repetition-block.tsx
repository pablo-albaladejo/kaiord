import type { RepetitionBlock, WorkoutStep } from "../../../types/krd";
import { SortableRepetitionBlockCard } from "./SortableRepetitionBlockCard";

type RenderRepetitionBlockProps = {
  item: RepetitionBlock;
  index: number;
  itemId: string;
  selectedStepId?: string | null;
  selectedStepIds?: readonly string[];
  onStepSelect?: (stepId: string) => void;
  onToggleStepSelection?: (stepId: string) => void;
  onStepDelete?: (stepIndex: number) => void;
  onDuplicateStepInRepetitionBlock?: (
    blockIndex: number,
    stepIndex: number
  ) => void;
  onEditRepetitionBlock?: (blockIndex: number, repeatCount: number) => void;
  onAddStepToRepetitionBlock?: (blockIndex: number) => void;
  onUngroupRepetitionBlock?: (blockIndex: number) => void;
  onDeleteRepetitionBlock?: (blockIndex: number) => void;
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

const createHandlers = (
  index: number,
  onEditRepetitionBlock?: (blockIndex: number, repeatCount: number) => void,
  onAddStepToRepetitionBlock?: (blockIndex: number) => void,
  onUngroupRepetitionBlock?: (blockIndex: number) => void,
  onDeleteRepetitionBlock?: (blockIndex: number) => void
) => ({
  onEditRepeatCount: onEditRepetitionBlock
    ? (count: number) => onEditRepetitionBlock(index, count)
    : undefined,
  onAddStep: onAddStepToRepetitionBlock
    ? () => onAddStepToRepetitionBlock(index)
    : undefined,
  onUngroup: onUngroupRepetitionBlock
    ? () => onUngroupRepetitionBlock(index)
    : undefined,
  onDelete: onDeleteRepetitionBlock
    ? () => onDeleteRepetitionBlock(index)
    : undefined,
});

export const renderRepetitionBlock = (props: RenderRepetitionBlockProps) => {
  const handlers = createHandlers(
    props.index,
    props.onEditRepetitionBlock,
    props.onAddStepToRepetitionBlock,
    props.onUngroupRepetitionBlock,
    props.onDeleteRepetitionBlock
  );

  return (
    <SortableRepetitionBlockCard
      id={props.itemId}
      block={props.item}
      blockIndex={props.index}
      selectedStepId={props.selectedStepId}
      selectedStepIds={props.selectedStepIds}
      onStepSelect={props.onStepSelect}
      onToggleStepSelection={props.onToggleStepSelection}
      onStepDelete={props.onStepDelete}
      onStepDuplicate={props.onDuplicateStepInRepetitionBlock}
      onReorderSteps={props.onReorderStepsInBlock}
      generateStepId={props.generateStepId}
      parentBlockIndex={props.index}
      {...handlers}
    />
  );
};
