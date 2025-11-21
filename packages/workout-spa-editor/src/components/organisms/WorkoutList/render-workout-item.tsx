/* eslint-disable max-lines */
import type { RepetitionBlock, WorkoutStep } from "../../../types/krd";
import { isRepetitionBlock } from "../../../types/krd";
import { SortableRepetitionBlockCard } from "./SortableRepetitionBlockCard";
import { renderStep } from "./WorkoutListItem";

type RenderWorkoutItemProps = {
  item: WorkoutStep | RepetitionBlock;
  index: number;
  itemId: string;
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
  // generateStepId will be used in task 5 to pass to SortableRepetitionBlockCard
  generateStepId: (
    item: WorkoutStep | RepetitionBlock,
    index: number,
    parentBlockIndex?: number
  ) => string;
};

export const renderWorkoutItem = ({
  item,
  index,
  itemId,
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
}: RenderWorkoutItemProps) => {
  if (isRepetitionBlock(item)) {
    return (
      <SortableRepetitionBlockCard
        id={itemId}
        block={item}
        blockIndex={index}
        selectedStepId={selectedStepId}
        selectedStepIds={selectedStepIds}
        onStepSelect={onStepSelect}
        onToggleStepSelection={onToggleStepSelection}
        onStepDelete={onStepDelete}
        onStepDuplicate={onDuplicateStepInRepetitionBlock}
        onEditRepeatCount={
          onEditRepetitionBlock
            ? (count: number) => onEditRepetitionBlock(index, count)
            : undefined
        }
        onAddStep={
          onAddStepToRepetitionBlock
            ? () => onAddStepToRepetitionBlock(index)
            : undefined
        }
        onReorderSteps={onReorderStepsInBlock}
        generateStepId={generateStepId}
        parentBlockIndex={index}
      />
    );
  }

  return renderStep({
    id: itemId,
    step: item,
    visualIndex: item.stepIndex,
    selectedStepId,
    selectedStepIds,
    onStepSelect,
    onToggleStepSelection,
    onStepDelete,
    onStepDuplicate,
  });
};
