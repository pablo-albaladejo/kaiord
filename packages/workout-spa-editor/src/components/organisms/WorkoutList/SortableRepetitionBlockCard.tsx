/* eslint-disable max-lines, max-lines-per-function */
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { parseStepId } from "../../../utils/step-id-parser";
import { RepetitionBlockCard } from "../../molecules/RepetitionBlockCard/RepetitionBlockCard";
import type { RepetitionBlock, WorkoutStep } from "../../../types/krd";

type SortableRepetitionBlockCardProps = {
  id: string;
  block: RepetitionBlock;
  blockIndex: number;
  selectedStepId?: string | null;
  selectedStepIds?: readonly string[];
  onStepSelect?: (stepId: string) => void;
  onToggleStepSelection?: (stepId: string) => void;
  onStepDelete?: (stepIndex: number) => void;
  onStepDuplicate?: (blockIndex: number, stepIndex: number) => void;
  onEditRepeatCount?: (count: number) => void;
  onAddStep?: () => void;
  onUngroup?: () => void;
  onDelete?: () => void;
  onReorderSteps?: (
    blockIndex: number,
    activeIndex: number,
    overIndex: number
  ) => void;
  generateStepId?: (
    item: WorkoutStep | RepetitionBlock,
    index: number,
    parentBlockIndex?: number
  ) => string;
  parentBlockIndex: number;
};

/**
 * SortableRepetitionBlockCard wraps RepetitionBlockCard with drag-and-drop functionality.
 *
 * Prop Handling:
 * - All component-specific props are explicitly destructured to prevent them from
 *   being passed to DOM elements via spread operators
 * - Only `restAttributes` from dnd-kit (which contains valid HTML attributes like
 *   data-*, aria-*, etc.) is spread onto the wrapper div
 * - This ensures no React warnings about unrecognized props
 */
export const SortableRepetitionBlockCard = ({
  id,
  block,
  blockIndex,
  selectedStepId,
  selectedStepIds,
  onStepSelect,
  onToggleStepSelection,
  onStepDelete,
  onStepDuplicate,
  onEditRepeatCount,
  onAddStep,
  onUngroup,
  onDelete,
  onReorderSteps,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateStepId: _generateStepId, // Explicitly destructure but don't use (passed by parent but not needed)
  parentBlockIndex,
}: SortableRepetitionBlockCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Remove 'role' from attributes to avoid conflicts with accessibility
  // Only spread valid HTML attributes (data-*, aria-*, etc.) to the wrapper div
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role, ...htmlAttributes } = attributes;

  // Extract selected step index from selectedStepId using parseStepId utility
  // Handle hierarchical ID format: "step-{index}" or "block-{blockIndex}-step-{stepIndex}"
  const selectedStepIndex = (() => {
    if (!selectedStepId) return undefined;

    try {
      const parsed = parseStepId(selectedStepId);

      // Only select steps that belong to this specific block
      if (parsed.type === "step") {
        // If the selected step is in this block (has matching blockIndex)
        if (
          parsed.blockIndex !== undefined &&
          parsed.blockIndex === parentBlockIndex
        ) {
          return parsed.stepIndex;
        }
        // If the selected step is in the main workout (no blockIndex), don't select anything in this block
        if (parsed.blockIndex === undefined) {
          return undefined;
        }
      }

      return undefined;
    } catch (error) {
      // If parsing fails, log warning and return undefined
      console.warn("Failed to parse step ID:", selectedStepId, error);
      return undefined;
    }
  })();

  return (
    <div ref={setNodeRef} style={style} {...htmlAttributes}>
      <RepetitionBlockCard
        block={block}
        selectedStepIndex={selectedStepIndex}
        selectedStepIds={selectedStepIds}
        onSelectStep={onStepSelect}
        onToggleStepSelection={onToggleStepSelection}
        onRemoveStep={onStepDelete}
        onDuplicateStep={
          onStepDuplicate
            ? (stepIndex: number) => onStepDuplicate(blockIndex, stepIndex)
            : undefined
        }
        onEditRepeatCount={onEditRepeatCount}
        onAddStep={onAddStep}
        onUngroup={onUngroup}
        onDelete={onDelete}
        onReorderSteps={
          onReorderSteps
            ? (activeIndex: number, overIndex: number) =>
                onReorderSteps(blockIndex, activeIndex, overIndex)
            : undefined
        }
        isDragging={isDragging}
        dragHandleProps={listeners}
        blockIndex={parentBlockIndex}
      />
    </div>
  );
};
