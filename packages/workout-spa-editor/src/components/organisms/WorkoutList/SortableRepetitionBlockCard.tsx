import { useDndCardWrapper } from "../../../hooks/use-dnd-card-wrapper";
import { RepetitionBlockCard } from "../../molecules/RepetitionBlockCard/RepetitionBlockCard";
import { parseSelectedStepIndex } from "./parse-selected-step-index";
import { buildBlockHandlers } from "./sortable-repetition-block-card.helpers";
import type { SortableRepetitionBlockCardProps } from "./sortable-repetition-block-card.types";

/** Wraps RepetitionBlockCard with drag-and-drop sorting. */
export const SortableRepetitionBlockCard = ({
  id,
  block,
  blockIndex,
  selectedStepId,
  selectedStepIds,
  onStepSelect,
  onBlockSelect,
  onToggleStepSelection,
  onStepDelete,
  onStepDuplicate,
  onEditRepeatCount,
  onAddStep,
  onUngroup,
  onDelete,
  onReorderSteps,
  parentBlockIndex,
}: SortableRepetitionBlockCardProps) => {
  const { wrapperProps, dragHandleProps, style, isDragging } =
    useDndCardWrapper(id);
  const selectedStepIndex = parseSelectedStepIndex(selectedStepId, block);
  const { handleDuplicate, handleReorder } = buildBlockHandlers({
    onStepDuplicate,
    onReorderSteps,
    blockIndex,
  });

  return (
    <div {...wrapperProps} style={style} data-step-id={id}>
      <RepetitionBlockCard
        block={block}
        selectedStepIndex={selectedStepIndex}
        selectedStepIds={selectedStepIds}
        onSelectStep={onStepSelect}
        onBlockSelect={onBlockSelect}
        onToggleStepSelection={onToggleStepSelection}
        onRemoveStep={onStepDelete}
        onDuplicateStep={handleDuplicate}
        onEditRepeatCount={onEditRepeatCount}
        onAddStep={onAddStep}
        onUngroup={onUngroup}
        onDelete={onDelete}
        onReorderSteps={handleReorder}
        isDragging={isDragging}
        dragHandleProps={dragHandleProps}
        blockIndex={parentBlockIndex}
      />
    </div>
  );
};
