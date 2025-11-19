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
  onSelectStep?: (index: number) => void;
  selectedStepIndex?: number;
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
      onSelectStep,
      selectedStepIndex,
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
    const classes = [baseClasses, className].filter(Boolean).join(" ");

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
        />

        {isExpanded && (
          <RepetitionBlockSteps
            steps={block.steps}
            selectedStepIndex={selectedStepIndex}
            onSelectStep={onSelectStep}
            onRemoveStep={onRemoveStep}
            onAddStep={onAddStep}
          />
        )}
      </div>
    );
  }
);

RepetitionBlockCard.displayName = "RepetitionBlockCard";
