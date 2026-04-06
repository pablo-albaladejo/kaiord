import { useSortable } from "@dnd-kit/sortable";

import { RepetitionBlockCard } from "../../molecules/RepetitionBlockCard/RepetitionBlockCard";
import { parseSelectedStepIndex } from "./parse-selected-step-index";
import {
  buildBlockHandlers,
  buildSortableStyle,
} from "./sortable-repetition-block-card.helpers";
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
  const sortable = useSortable({ id });
  const style = buildSortableStyle(
    sortable.transform,
    sortable.transition,
    sortable.isDragging
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role, ...htmlAttributes } = sortable.attributes;
  const selectedStepIndex = parseSelectedStepIndex(
    selectedStepId,
    parentBlockIndex
  );
  const { handleDuplicate, handleReorder } = buildBlockHandlers({
    onStepDuplicate,
    onReorderSteps,
    blockIndex,
  });

  return (
    <div ref={sortable.setNodeRef} style={style} {...htmlAttributes}>
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
        isDragging={sortable.isDragging}
        dragHandleProps={sortable.listeners}
        blockIndex={parentBlockIndex}
      />
    </div>
  );
};
