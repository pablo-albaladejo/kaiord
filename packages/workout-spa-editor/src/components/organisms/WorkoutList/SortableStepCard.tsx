import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WorkoutStep } from "../../../types/krd";
import { StepCard } from "../../molecules/StepCard/StepCard";

type SortableStepCardProps = {
  id: string;
  step: WorkoutStep;
  visualIndex: number;
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelect?: () => void;
  onToggleMultiSelect?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
};

export const SortableStepCard = ({
  id,
  step,
  visualIndex,
  isSelected,
  isMultiSelected,
  onSelect,
  onToggleMultiSelect,
  onDelete,
  onDuplicate,
}: SortableStepCardProps) => {
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

  return (
    <div ref={setNodeRef} style={style} {...restAttributes}>
      <StepCard
        step={step}
        visualIndex={visualIndex}
        isSelected={isSelected}
        isMultiSelected={isMultiSelected}
        onSelect={onSelect}
        onToggleMultiSelect={onToggleMultiSelect}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
};
