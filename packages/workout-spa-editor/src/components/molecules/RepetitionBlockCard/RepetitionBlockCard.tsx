/* eslint-disable max-lines, max-lines-per-function */
import { forwardRef, type HTMLAttributes } from "react";
import type { RepetitionBlock } from "../../../types/krd";
import type { DragHandleProps } from "../StepCard/StepCard";
import { RepetitionBlockHeader } from "./RepetitionBlockHeader";
import { RepetitionBlockSteps } from "./RepetitionBlockSteps";
import { useRepetitionBlockState } from "./use-repetition-block-state";

/**
 * Props for the RepetitionBlockCard component.
 *
 * This component displays a repetition block with its contained steps.
 * Each block has a unique ID that persists across operations.
 *
 * @property block - The repetition block to display (must have a unique `id`)
 * @property onEditRepeatCount - Callback when repeat count is edited
 * @property onAddStep - Callback to add a new step to the block
 * @property onRemoveStep - Callback to remove a step by index
 * @property onDuplicateStep - Callback to duplicate a step by index
 * @property onSelectStep - Callback when a step is selected
 * @property onToggleStepSelection - Callback to toggle step selection
 * @property onReorderSteps - Callback when steps are reordered via drag-and-drop
 * @property onUngroup - Callback to ungroup the block into individual steps
 * @property onDelete - Callback to delete the entire block (uses block.id internally)
 * @property selectedStepIndex - Currently selected step index (deprecated, use selectedStepIds)
 * @property selectedStepIds - Set of selected step IDs
 * @property isDragging - Whether the block is currently being dragged
 * @property dragHandleProps - Props for the drag handle (from dnd-kit)
 * @property blockIndex - Visual index of the block (for display only, not used for operations)
 */
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

/**
 * RepetitionBlockCard Component
 *
 * Displays a repetition block with its contained steps. Each block has a unique ID
 * that ensures correct identification across all operations (deletion, editing, reordering).
 *
 * ## Block ID System
 *
 * Each block must have a unique `id` field:
 * - Format: `block-{timestamp}-{random}` (e.g., "block-1704123456789-x7k2m9p4q")
 * - Generated automatically when blocks are created
 * - Persists across all operations (edit, move, undo/redo)
 * - Used for deletion to ensure the correct block is removed
 *
 * ## Features
 *
 * - **Expandable/Collapsible**: Click header to toggle step visibility
 * - **Editable Repeat Count**: Click count to edit inline
 * - **Drag and Drop**: Reorder blocks and steps within blocks
 * - **Keyboard Navigation**: Full keyboard support (Delete/Backspace to delete)
 * - **Undo/Redo**: All operations are undoable
 *
 * ## Deletion Behavior
 *
 * When `onDelete` is called:
 * 1. The block's unique ID is used to locate it in the workout
 * 2. The entire block and all its steps are removed
 * 3. Step indices are recalculated for remaining steps
 * 4. The operation is added to undo history
 *
 * This ensures the correct block is always deleted, even if blocks have been
 * reordered via drag-and-drop.
 *
 * @example
 * ```tsx
 * <RepetitionBlockCard
 *   block={block} // Must have block.id
 *   onDelete={() => deleteRepetitionBlock(block.id)} // Uses ID, not index
 *   onEditRepeatCount={(count) => editBlock(block.id, count)}
 *   onUngroup={() => ungroupBlock(block.id)}
 * />
 * ```
 */
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
      ...htmlProps
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
        // Only delete when the block card itself is focused, not inner controls
        if (event.currentTarget !== event.target) return;

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
        {...htmlProps}
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
