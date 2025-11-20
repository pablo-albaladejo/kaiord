/* eslint-disable max-lines, max-lines-per-function */
import { forwardRef, type HTMLAttributes } from "react";
import type { RepetitionBlock } from "../../../types/krd";
import { RepetitionBlockHeader } from "./RepetitionBlockHeader";
import { RepetitionBlockSteps } from "./RepetitionBlockSteps";
import { useRepetitionBlockState } from "./use-repetition-block-state";

export type RepetitionBlockCardProps = HTMLAttributes<HTMLDivElement> & {
  block: RepetitionBlock;
  onEditRepeatCount?: (count: number) => void;
  onAddStep?: () => void;
  onRemoveStep?: (index: number) => void;
  onDuplicateStep?: (index: number) => void;
  onSelectStep?: (index: number) => void;
  onReorderSteps?: (activeIndex: number, overIndex: number) => void;
  selectedStepIndex?: number;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
};

export const RepetitionBlockCard = forwardRef<
  HTMLDivElement,
  RepetitionBlockCardProps
>(
  (
    {
      block,
      onEditRepeatCount,
      onAddStep,
      onRemoveStep,
      onDuplicateStep,
      onSelectStep,
      onReorderSteps,
      selectedStepIndex,
      isDragging = false,
      dragHandleProps,
      className = "",
      ...props
    },
    ref
  ) => {
    const {
      isExpanded,
      isEditingCount,
      editValue,
      setEditValue,
      handleToggleExpand,
      handleEditClick,
      handleSaveCount,
      handleCancelEdit,
      handleKeyDown,
    } = useRepetitionBlockState(block, onEditRepeatCount);

    const baseClasses =
      "rounded-lg border-2 border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-950/20 p-4 transition-colors";
    const draggingClasses = isDragging ? "cursor-grabbing" : "";
    const classes = [baseClasses, draggingClasses, className]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        ref={ref}
        className={classes}
        data-testid="repetition-block-card"
        {...props}
      >
        <RepetitionBlockHeader
          block={block}
          isExpanded={isExpanded}
          isEditingCount={isEditingCount}
          editValue={editValue}
          onToggleExpand={handleToggleExpand}
          onEditClick={handleEditClick}
          onSaveCount={handleSaveCount}
          onCancelEdit={handleCancelEdit}
          onEditValueChange={setEditValue}
          onKeyDown={handleKeyDown}
          dragHandleProps={dragHandleProps}
        />

        {isExpanded && (
          <RepetitionBlockSteps
            steps={block.steps}
            selectedStepIndex={selectedStepIndex}
            onSelectStep={onSelectStep}
            onRemoveStep={onRemoveStep}
            onDuplicateStep={onDuplicateStep}
            onAddStep={onAddStep}
            onReorderSteps={onReorderSteps}
          />
        )}
      </div>
    );
  }
);

RepetitionBlockCard.displayName = "RepetitionBlockCard";
