import { forwardRef } from "react";

import { useFocusRegistration } from "../../../hooks/focus/use-focus-registration";
import { mergeRefs } from "../../../lib/merge-refs";
import {
  buildBlockClasses,
  buildBlockLabel,
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
  const registration = useFocusRegistration<HTMLDivElement>(block.id);
  return (
    <div
      ref={mergeRefs(ref, registration.ref)}
      className={buildBlockClasses(isDragging, className)}
      data-testid="repetition-block-card"
      tabIndex={0}
      aria-label={buildBlockLabel(block)}
      onClick={handleBlockClick}
      onKeyDown={handleKeyDown}
      {...htmlProps}
    >
      <RepetitionBlockHeader
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
