import { SortableRepetitionBlockCard } from "./SortableRepetitionBlockCard";
import type { RenderRepetitionBlockProps } from "./render-repetition-block.types";

const createHandlers = (
  blockId: string | undefined,
  onEdit?: (blockId: string, repeatCount: number) => void,
  onAdd?: (blockId: string) => void,
  onUngroup?: (blockId: string) => void,
  onDelete?: (blockId: string) => void,
  onDuplicate?: (blockId: string, stepIndex: number) => void,
  onReorder?: (blockId: string, activeIndex: number, overIndex: number) => void
) => {
  if (!blockId)
    return {
      onEditRepeatCount: undefined,
      onAddStep: undefined,
      onUngroup: undefined,
      onDelete: undefined,
      onStepDuplicate: undefined,
      onReorderSteps: undefined,
    };
  return {
    onEditRepeatCount: onEdit
      ? (count: number) => onEdit(blockId, count)
      : undefined,
    onAddStep: onAdd ? () => onAdd(blockId) : undefined,
    onUngroup: onUngroup ? () => onUngroup(blockId) : undefined,
    onDelete: onDelete ? () => onDelete(blockId) : undefined,
    onStepDuplicate: onDuplicate
      ? (_: number, stepIndex: number) => onDuplicate(blockId, stepIndex)
      : undefined,
    onReorderSteps: onReorder
      ? (_: number, activeIndex: number, overIndex: number) =>
          onReorder(blockId, activeIndex, overIndex)
      : undefined,
  };
};

export const renderRepetitionBlock = (props: RenderRepetitionBlockProps) => {
  const handlers = createHandlers(
    props.item.id,
    props.onEditRepetitionBlock,
    props.onAddStepToRepetitionBlock,
    props.onUngroupRepetitionBlock,
    props.onDeleteRepetitionBlock,
    props.onDuplicateStepInRepetitionBlock,
    props.onReorderStepsInBlock
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
      generateStepId={props.generateStepId}
      parentBlockIndex={props.index}
      {...handlers}
    />
  );
};
