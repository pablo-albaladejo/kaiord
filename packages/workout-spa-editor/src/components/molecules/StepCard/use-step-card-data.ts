import { getStepLabel } from "./get-step-label";
import { renderStepCardContent } from "./render-step-card-content";
import { getStepCardClasses } from "./use-step-card-classes";
import type { StepCardProps } from "./StepCard.types";

/** Compute derived data and content for StepCard rendering. */
export function useStepCardData(props: StepCardProps) {
  const {
    step,
    visualIndex,
    isSelected = false,
    isMultiSelected = false,
    onDelete,
    onDuplicate,
    onCopy,
    isDragging = false,
    dragHandleProps,
    className = "",
  } = props;

  const selected = isSelected || isMultiSelected;
  const displayIndex = visualIndex ?? step.stepIndex;
  const hasActions = Boolean(onDelete || onDuplicate || onCopy);

  return {
    selected,
    displayIndex,
    label: getStepLabel(displayIndex, step.name, step),
    classes: getStepCardClasses(
      selected,
      hasActions,
      Boolean(dragHandleProps),
      className
    ),
    content: renderStepCardContent({
      step,
      displayIndex,
      intensity: step.intensity || "other",
      dragHandleProps,
      isDragging,
      onDelete,
      onDuplicate,
      onCopy,
    }),
  };
}
