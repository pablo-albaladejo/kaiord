import { forwardRef, type HTMLAttributes } from "react";
import type { WorkoutStep } from "../../../types/krd";
import { Badge } from "../../atoms/Badge/Badge";
import { Icon } from "../../atoms/Icon/Icon";
import { formatDuration } from "./format-duration";
import { getTargetIcon } from "./icons";
import { StepDetails } from "./StepDetails";
import { StepHeader } from "./StepHeader";

export type StepCardProps = HTMLAttributes<HTMLDivElement> & {
  step: WorkoutStep;
  isSelected?: boolean;
  onSelect?: (stepIndex: number) => void;
};

export const StepCard = forwardRef<HTMLDivElement, StepCardProps>(
  ({ step, isSelected = false, onSelect, className = "", ...props }, ref) => {
    const targetIcon = getTargetIcon(step.targetType);
    const intensity = step.intensity || "other";

    const handleClick = () => {
      if (onSelect) {
        onSelect(step.stepIndex);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    const baseClasses =
      "rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer hover:shadow-md";
    const selectedClasses = isSelected
      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";
    const classes = [baseClasses, selectedClasses, className]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        ref={ref}
        className={classes}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`Step ${step.stepIndex + 1}: ${step.name || formatDuration(step)}`}
        {...props}
      >
        <StepHeader stepIndex={step.stepIndex} intensity={intensity} />
        <StepDetails step={step} />

        <div className="mt-3">
          <Badge
            variant={step.targetType}
            size="sm"
            icon={<Icon icon={targetIcon} size="xs" />}
          >
            {step.targetType.replace(/_/g, " ")}
          </Badge>
        </div>

        {step.notes && (
          <p className="mt-3 text-xs text-gray-600 dark:text-gray-400 italic">
            {step.notes}
          </p>
        )}
      </div>
    );
  }
);

StepCard.displayName = "StepCard";
