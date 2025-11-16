import { forwardRef, type HTMLAttributes } from "react";
import type { WorkoutStep } from "../../../types/krd";
import { formatDuration } from "./format-duration";
import { StepCardActions } from "./StepCardActions";
import { StepCardFooter } from "./StepCardFooter";
import { StepDetails } from "./StepDetails";
import { StepHeader } from "./StepHeader";
import { getStepCardClasses } from "./use-step-card-classes";

export type StepCardProps = HTMLAttributes<HTMLDivElement> & {
  step: WorkoutStep;
  isSelected?: boolean;
  onSelect?: (stepIndex: number) => void;
  onDelete?: (stepIndex: number) => void;
  onDuplicate?: (stepIndex: number) => void;
};

export const StepCard = forwardRef<HTMLDivElement, StepCardProps>(
  (
    {
      step,
      isSelected = false,
      onSelect,
      onDelete,
      onDuplicate,
      className = "",
      ...props
    },
    ref
  ) => {
    const intensity = step.intensity || "other";
    const hasActions = Boolean(onDelete || onDuplicate);
    const classes = getStepCardClasses(isSelected, hasActions, className);

    const handleClick = () => onSelect?.(step.stepIndex);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <div
        ref={ref}
        className={classes}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`Step ${step.stepIndex + 1}: ${step.name || formatDuration(step)}`}
        data-testid="step-card"
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
