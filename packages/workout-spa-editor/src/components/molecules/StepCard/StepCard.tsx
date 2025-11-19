import { forwardRef, type HTMLAttributes } from "react";
import type { WorkoutStep } from "../../../types/krd";
import { formatDuration } from "./format-duration";
import { StepCardActions } from "./StepCardActions";
import { StepCardFooter } from "./StepCardFooter";
import { StepDetails } from "./StepDetails";
import { StepHeader } from "./StepHeader";
import { getStepCardClasses } from "./use-step-card-classes";
import { useStepCardHandlers } from "./use-step-card-handlers";

export type StepCardProps = HTMLAttributes<HTMLDivElement> & {
  step: WorkoutStep;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  onSelect?: (stepIndex: number) => void;
  onToggleMultiSelect?: (stepIndex: number) => void;
  onDelete?: (stepIndex: number) => void;
  onDuplicate?: (stepIndex: number) => void;
};

export const StepCard = forwardRef<HTMLDivElement, StepCardProps>(
  (
    {
      step,
      isSelected = false,
      isMultiSelected = false,
      onSelect,
      onToggleMultiSelect,
      onDelete,
      onDuplicate,
      className = "",
      ...props
    },
    ref
  ) => {
    const intensity = step.intensity || "other";
    const hasActions = Boolean(onDelete || onDuplicate);
    const classes = getStepCardClasses(
      isSelected || isMultiSelected,
      hasActions,
      className
    );

    const { handleClick, handleMouseDown, handleKeyDown } = useStepCardHandlers(
      { step, onSelect, onToggleMultiSelect }
    );

    return (
      <div
        ref={ref}
        className={classes}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`Step ${step.stepIndex + 1}: ${step.name || formatDuration(step)}`}
        data-testid="step-card"
        data-selected={isSelected || isMultiSelected ? "true" : "false"}
        {...props}
      >
        <StepCardActions
          stepIndex={step.stepIndex}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
        <StepHeader stepIndex={step.stepIndex} intensity={intensity} />
        <StepDetails step={step} />
        <StepCardFooter step={step} />
      </div>
    );
  }
);

StepCard.displayName = "StepCard";
