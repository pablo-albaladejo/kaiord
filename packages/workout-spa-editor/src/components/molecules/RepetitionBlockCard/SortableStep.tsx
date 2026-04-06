import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { WorkoutStep } from "../../../types/krd";
import { StepCard } from "../StepCard/StepCard";

export type SortableStepProps = {
  step: WorkoutStep;
  id: string;
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelect?: () => void;
  onToggleMultiSelect?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
};

export const SortableStep = ({
  step,
  id,
  isSelected,
  isMultiSelected,
  onSelect,
  onToggleMultiSelect,
  onDelete,
  onDuplicate,
}: SortableStepProps) => {
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

  // Remove role="button" from attributes to avoid conflict with StepCard's button role
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role, ...restAttributes } = attributes;

  return (
    <div ref={setNodeRef} style={style} {...restAttributes}>
      <StepCard
        step={step}
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
