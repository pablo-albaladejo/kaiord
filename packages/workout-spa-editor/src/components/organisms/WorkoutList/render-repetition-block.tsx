import type { RenderRepetitionBlockProps } from "./render-repetition-block.types";
import { SortableRepetitionBlockCard } from "./SortableRepetitionBlockCard";

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

/**
 * Steps inside a block are addressed by their position *within the
 * block*, so their trash affordance must go to the block-scoped store
 * action. Falling back to the main-list `onStepDelete` would hand a
 * block-local index to an action that resolves it against the top-level
 * step list, deleting an unrelated step.
 */
const createDeleteStepHandler = (
  blockId: string | undefined,
  onDeleteStepInBlock?: (blockId: string, stepIndex: number) => void
) => {
  if (!blockId || !onDeleteStepInBlock) return undefined;
  return (stepIndex: number) => onDeleteStepInBlock(blockId, stepIndex);
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
      onBlockSelect={props.onBlockSelect}
      onToggleStepSelection={props.onToggleStepSelection}
      onStepDelete={createDeleteStepHandler(
        props.item.id,
        props.onDeleteStepInRepetitionBlock
      )}
      generateStepId={props.generateStepId}
      parentBlockIndex={props.index}
      {...handlers}
    />
  );
};
