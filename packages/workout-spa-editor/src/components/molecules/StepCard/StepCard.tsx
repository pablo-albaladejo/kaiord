import { forwardRef, type HTMLAttributes } from "react";
import type { WorkoutStep } from "../../../types/krd";
<<<<<<< HEAD
import { formatDuration } from "./format-duration";
import { StepCardActions } from "./StepCardActions";
import { StepCardFooter } from "./StepCardFooter";
import { StepDetails } from "./StepDetails";
import { StepHeader } from "./StepHeader";
import { getStepCardClasses } from "./use-step-card-classes";
=======
import { Badge } from "../../atoms/Badge/Badge";
import { Icon } from "../../atoms/Icon/Icon";
import { formatDuration } from "./format-duration";
import { formatTarget } from "./format-target";
import { getDurationIcon, getTargetIcon } from "./icons";
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)

export type StepCardProps = HTMLAttributes<HTMLDivElement> & {
  step: WorkoutStep;
  isSelected?: boolean;
  onSelect?: (stepIndex: number) => void;
<<<<<<< HEAD
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

=======
};

export const StepCard = forwardRef<HTMLDivElement, StepCardProps>(
  ({ step, isSelected = false, onSelect, className = "", ...props }, ref) => {
    const targetIcon = getTargetIcon(step.targetType);
    const durationIcon = getDurationIcon(step.durationType);
    const intensity = step.intensity || "other";

    const handleClick = () => {
      if (onSelect) {
        onSelect(step.stepIndex);
      }
    };

    const baseClasses =
      "rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer hover:shadow-md";
    const selectedClasses = isSelected
      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";
    const paddingClasses = onDelete ? "pb-12" : "";
    const classes = [baseClasses, selectedClasses, paddingClasses, className]
      .filter(Boolean)
      .join(" ");

>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
    return (
      <div
        ref={ref}
        className={classes}
        onClick={handleClick}
        role="button"
        tabIndex={0}
<<<<<<< HEAD
        onKeyDown={handleKeyDown}
        aria-label={`Step ${step.stepIndex + 1}: ${step.name || formatDuration(step)}`}
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
=======
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={`Step ${step.stepIndex + 1}: ${step.name || formatDuration(step)}`}
        {...props}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Step {step.stepIndex + 1}
          </span>
          <Badge variant={intensity} size="sm">
            {intensity}
          </Badge>
        </div>

        {step.name && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {step.name}
          </h3>
        )}

        <div className="flex items-center gap-2 mb-2">
          <Icon icon={durationIcon} size="sm" color="secondary" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {formatDuration(step)}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Icon icon={targetIcon} size="sm" color="secondary" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {formatTarget(step)}
          </span>
        </div>

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
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
      </div>
    );
  }
);

StepCard.displayName = "StepCard";
