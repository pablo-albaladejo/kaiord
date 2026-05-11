import { useDndCardWrapper } from "../../../hooks/use-dnd-card-wrapper";
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
  const { wrapperProps, dragHandleProps, style, isDragging } =
    useDndCardWrapper(id);

  return (
    <div {...wrapperProps} style={style}>
      <StepCard
        step={step}
        isSelected={isSelected}
        isMultiSelected={isMultiSelected}
        onSelect={onSelect}
        onToggleMultiSelect={onToggleMultiSelect}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        isDragging={isDragging}
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
};
