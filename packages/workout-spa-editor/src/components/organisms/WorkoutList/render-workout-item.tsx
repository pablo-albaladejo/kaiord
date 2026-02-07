import { renderRepetitionBlock } from "./render-repetition-block";
import { renderStep } from "./WorkoutListItem";
import { isRepetitionBlock } from "../../../types/krd";
import type { RepetitionBlock, WorkoutStep } from "../../../types/krd";

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
};

export const renderWorkoutItem = (props: RenderWorkoutItemProps) => {
  if (isRepetitionBlock(props.item)) {
    return renderRepetitionBlock({
      ...props,
      item: props.item,
    });
  }

  return renderStep({
    id: props.itemId,
    step: props.item,
    visualIndex: props.index,
    selectedStepId: props.selectedStepId,
    selectedStepIds: props.selectedStepIds,
    onStepSelect: props.onStepSelect,
    onToggleStepSelection: props.onToggleStepSelection,
    onStepDelete: props.onStepDelete,
    onStepDuplicate: props.onStepDuplicate,
    onStepCopy: props.onStepCopy,
  });
};
