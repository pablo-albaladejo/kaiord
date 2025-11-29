/* eslint-disable max-lines, max-lines-per-function */
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RepetitionBlock, WorkoutStep } from "../../../types/krd";
import { parseStepId } from "../../../utils/step-id-parser";
import { RepetitionBlockCard } from "../../molecules/RepetitionBlockCard/RepetitionBlockCard";

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
  generateStepId: (
    item: WorkoutStep | RepetitionBlock,
    index: number,
    parentBlockIndex?: number
  ) => string;
  parentBlockIndex: number;
};

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role, ...restAttributes } = attributes;

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
    <div ref={setNodeRef} style={style} {...restAttributes}>
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
