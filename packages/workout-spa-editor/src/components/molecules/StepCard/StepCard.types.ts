import type { HTMLAttributes } from "react";
import type { WorkoutStep } from "../../../types/krd";

export type StepCardProps = HTMLAttributes<HTMLDivElement> & {
  step: WorkoutStep;
  visualIndex?: number;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  onSelect?: (stepIndex: number) => void;
  onToggleMultiSelect?: (stepIndex: number) => void;
  onDelete?: (stepIndex: number) => void;
  onDuplicate?: (stepIndex: number) => void;
  isDragging?: boolean;
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
};
