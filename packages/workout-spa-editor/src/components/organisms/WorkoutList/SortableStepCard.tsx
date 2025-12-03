import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { HTMLAttributes } from "react";
import type { WorkoutStep } from "../../../types/krd";
import { StepCard } from "../../molecules/StepCard/StepCard";

// Component-specific props
type SortableStepCardOwnProps = {
  id: string;
  step: WorkoutStep;
  visualIndex: number;
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelect?: () => void;
  onToggleMultiSelect?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onCopy?: () => void;
};

// Combine with HTML attributes for the wrapper div
export type SortableStepCardProps = SortableStepCardOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof SortableStepCardOwnProps>;

export const SortableStepCard = ({
  // Component-specific props (explicitly destructured)
  id,
  step,
  visualIndex,
  isSelected,
  isMultiSelected,
  onSelect,
  onToggleMultiSelect,
  onDelete,
  onDuplicate,
  onCopy,
  // HTML attributes (can be spread to wrapper div)
  ...htmlProps
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

  // Remove role attribute to prevent conflicts with StepCard's role
  // Merge dnd-kit attributes with component HTML props
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role, ...dndAttributes } = attributes;

  return (
    <div ref={setNodeRef} style={style} {...dndAttributes} {...htmlProps}>
      <StepCard
        step={step}
        visualIndex={visualIndex}
        isSelected={isSelected}
        isMultiSelected={isMultiSelected}
        onSelect={onSelect}
        onToggleMultiSelect={onToggleMultiSelect}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onCopy={onCopy}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
};
