/* eslint-disable max-lines, max-lines-per-function */
import { forwardRef, type HTMLAttributes } from "react";
import type { RepetitionBlock } from "../../../types/krd";
import type { DragHandleProps } from "../StepCard/StepCard";
import { RepetitionBlockHeader } from "./RepetitionBlockHeader";
import { RepetitionBlockSteps } from "./RepetitionBlockSteps";
import { useRepetitionBlockState } from "./use-repetition-block-state";

export type RepetitionBlockCardProps = HTMLAttributes<HTMLDivElement> & {
  block: RepetitionBlock;
  onEditRepeatCount?: (count: number) => void;
  onAddStep?: () => void;
  onRemoveStep?: (index: number) => void;
  onDuplicateStep?: (index: number) => void;
  onSelectStep?: (stepId: string) => void;
  onToggleStepSelection?: (stepId: string) => void;
  onReorderSteps?: (activeIndex: number, overIndex: number) => void;
  onUngroup?: () => void;
  onDelete?: () => void;
  selectedStepIndex?: number;
  selectedStepIds?: readonly string[];
  isDragging?: boolean;
  dragHandleProps?: DragHandleProps;
  blockIndex?: number;
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

    const handleBlockKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Handle Delete and Backspace keys for block deletion
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        onDelete &&
        !isEditingCount
      ) {
        // Prevent default behavior (e.g., browser back navigation for Backspace)
        event.preventDefault();
        event.stopPropagation();
        onDelete();
      }
    };

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
        tabIndex={0}
        onKeyDown={handleBlockKeyDown}
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
          onAddStep={onAddStep}
          onUngroup={onUngroup}
          onDelete={onDelete}
          dragHandleProps={dragHandleProps}
        />

        {isExpanded && (
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
  }
);

RepetitionBlockCard.displayName = "RepetitionBlockCard";
