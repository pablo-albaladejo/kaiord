import { forwardRef } from "react";

import {
  buildBlockClasses,
  createBlockClickHandler,
  createBlockKeyDownHandler,
} from "./repetition-block-card.helpers";
import type { RepetitionBlockCardProps } from "./repetition-block-card.types";
import { RepetitionBlockHeader } from "./RepetitionBlockHeader";
import { RepetitionBlockSteps } from "./RepetitionBlockSteps";
import { useRepetitionBlockState } from "./use-repetition-block-state";

export type { RepetitionBlockCardProps } from "./repetition-block-card.types";

export const RepetitionBlockCard = forwardRef<
  HTMLDivElement,
  RepetitionBlockCardProps
>((props, ref) => {
  const {
    block,
    onEditRepeatCount,
    onAddStep,
    onRemoveStep,
    onDuplicateStep,
    onSelectStep,
    onBlockSelect,
    onToggleStepSelection,
    onReorderSteps,
    onUngroup,
    onDelete,
    selectedStepIndex,
    selectedStepIds,
    isDragging = false,
    dragHandleProps,
    blockIndex,
    className = "",
    ...htmlProps
  } = props;
  const s = useRepetitionBlockState(block, onEditRepeatCount);
  const handleBlockClick = createBlockClickHandler(block.id, onBlockSelect);
  const handleKeyDown = createBlockKeyDownHandler(onDelete, s.isEditingCount);

  return (
    <div
      ref={ref}
      className={buildBlockClasses(isDragging, className)}
      data-testid="repetition-block-card"
      tabIndex={0}
      onClick={handleBlockClick}
      onKeyDown={handleKeyDown}
      {...htmlProps}
    >
      <RepetitionBlockHeader
        block={block}
        {...s.headerStateProps}
        onAddStep={onAddStep}
        onUngroup={onUngroup}
        onDelete={onDelete}
        dragHandleProps={dragHandleProps}
      />
      {s.isExpanded && (
        <RepetitionBlockSteps
          steps={block.steps}
          selectedStepIndex={selectedStepIndex}
          selectedStepIds={selectedStepIds}
          onSelectStep={onSelectStep}
          onToggleStepSelection={onToggleStepSelection}
          onRemoveStep={onRemoveStep}
          onDuplicateStep={onDuplicateStep}
          onAddStep={onAddStep}
          onReorderSteps={onReorderSteps}
          blockIndex={blockIndex}
        />
      )}
    </div>
  );
});

RepetitionBlockCard.displayName = "RepetitionBlockCard";
