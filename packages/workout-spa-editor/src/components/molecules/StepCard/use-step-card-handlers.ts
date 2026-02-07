import { isModifierKeyPressed } from "./use-modifier-detection";
import type { WorkoutStep } from "../../../types/krd";

type StepCardHandlersProps = {
  step: WorkoutStep;
  onSelect?: (stepIndex: number) => void;
  onToggleMultiSelect?: (stepIndex: number) => void;
};

export function useStepCardHandlers({
  step,
  onSelect,
  onToggleMultiSelect,
}: StepCardHandlersProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (isModifierKeyPressed(e)) {
      e.preventDefault();
      e.stopPropagation();
      onToggleMultiSelect?.(step.stepIndex);
    } else {
      onSelect?.(step.stepIndex);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isModifierKeyPressed(e)) {
      e.preventDefault();
      e.stopPropagation();
      onToggleMultiSelect?.(step.stepIndex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
  };

  return { handleClick, handleMouseDown, handleKeyDown };
}
