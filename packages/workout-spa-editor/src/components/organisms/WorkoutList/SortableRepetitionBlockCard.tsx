import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RepetitionBlock } from "../../../types/krd";
import { RepetitionBlockCard } from "../../molecules/RepetitionBlockCard/RepetitionBlockCard";

type SortableRepetitionBlockCardProps = {
  id: string;
  block: RepetitionBlock;
  blockIndex: number;
  selectedStepId?: string | null;
  onStepSelect?: (stepIndex: number) => void;
  onStepDelete?: (stepIndex: number) => void;
  onStepDuplicate?: (blockIndex: number, stepIndex: number) => void;
  onEditRepeatCount?: (count: number) => void;
  onAddStep?: () => void;
  onReorderSteps?: (
    blockIndex: number,
    activeIndex: number,
    overIndex: number
  ) => void;
};

export const SortableRepetitionBlockCard = ({
  id,
  block,
  blockIndex,
  selectedStepId,
  onStepSelect,
  onStepDelete,
  onStepDuplicate,
  onEditRepeatCount,
  onAddStep,
  onReorderSteps,
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

  // Extract selected step index from selectedStepId (format: "step-{index}")
  const selectedStepIndex = selectedStepId?.startsWith("step-")
    ? Number.parseInt(selectedStepId.split("-")[1], 10)
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...restAttributes}>
      <RepetitionBlockCard
        block={block}
        selectedStepIndex={selectedStepIndex}
        onSelectStep={onStepSelect}
        onRemoveStep={onStepDelete}
        onDuplicateStep={
          onStepDuplicate
            ? (stepIndex: number) => onStepDuplicate(blockIndex, stepIndex)
            : undefined
        }
        onEditRepeatCount={onEditRepeatCount}
        onAddStep={onAddStep}
        onReorderSteps={
          onReorderSteps
            ? (activeIndex: number, overIndex: number) =>
                onReorderSteps(blockIndex, activeIndex, overIndex)
            : undefined
        }
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
};
