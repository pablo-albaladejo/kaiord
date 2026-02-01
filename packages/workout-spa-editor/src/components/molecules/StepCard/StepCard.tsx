import { forwardRef } from "react";
import { SelectionIndicator } from "../SelectionIndicator";
import { getStepLabel } from "./get-step-label";
import { renderStepCardContent } from "./render-step-card-content";
import type { DragHandleProps, StepCardProps } from "./StepCard.types";
import { getStepCardClasses } from "./use-step-card-classes";
import { useStepCardHandlers } from "./use-step-card-handlers";

export type { DragHandleProps, StepCardProps };

export const StepCard = forwardRef<HTMLDivElement, StepCardProps>(
  (
    {
      step,
      visualIndex,
      isSelected = false,
      isMultiSelected = false,
      onSelect,
      onToggleMultiSelect,
      onDelete,
      onDuplicate,
      onCopy,
      isDragging = false,
      dragHandleProps,
      className = "",
      ...htmlProps
    },
    ref
  ) => {
    const intensity = step.intensity || "other";
    const selected = isSelected || isMultiSelected;
    const classes = getStepCardClasses(
      selected,
      Boolean(onDelete || onDuplicate || onCopy),
      Boolean(dragHandleProps),
      className
    );
    const handlers = useStepCardHandlers({
      step,
      onSelect,
      onToggleMultiSelect,
    });
    const displayIndex = visualIndex ?? step.stepIndex;
    const label = getStepLabel(displayIndex, step.name, step);

    return (
      <div
        ref={ref}
        className={classes}
        onClick={handlers.handleClick}
        onMouseDown={handlers.handleMouseDown}
        role="button"
        tabIndex={0}
        onKeyDown={handlers.handleKeyDown}
        aria-label={label}
        aria-selected={selected}
        data-testid="step-card"
        data-selected={selected ? "true" : "false"}
        {...htmlProps}
      >
        <SelectionIndicator selected={selected} />
        {renderStepCardContent({
          step,
          displayIndex,
          intensity,
          dragHandleProps,
          isDragging,
          onDelete,
          onDuplicate,
          onCopy,
        })}
      </div>
    );
  }
);
StepCard.displayName = "StepCard";
