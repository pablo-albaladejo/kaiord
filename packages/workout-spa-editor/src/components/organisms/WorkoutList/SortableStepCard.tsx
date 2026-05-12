import type { HTMLAttributes } from "react";

import { useDndCardWrapper } from "../../../hooks/use-dnd-card-wrapper";
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
  ...htmlProps
}: SortableStepCardProps) => {
  const { wrapperProps, dragHandleProps, style, isDragging } =
    useDndCardWrapper(id);

  return (
    <div {...wrapperProps} style={style} {...htmlProps} data-step-id={id}>
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
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
};
