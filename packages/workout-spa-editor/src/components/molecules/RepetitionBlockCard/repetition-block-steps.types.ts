import type { WorkoutStep } from "../../../types/krd";

export type RepetitionBlockStepsProps = {
  steps: WorkoutStep[];
  selectedStepIndex?: number;
  selectedStepIds?: readonly string[];
  onSelectStep?: (stepId: string) => void;
  onToggleStepSelection?: (stepId: string) => void;
  onRemoveStep?: (index: number) => void;
  onDuplicateStep?: (index: number) => void;
  onAddStep?: () => void;
  onReorderSteps?: (activeIndex: number, overIndex: number) => void;
  blockIndex?: number;
};

export function buildSortableIds(
  steps: WorkoutStep[],
  blockIndex?: number
): string[] {
  return steps.map((step) =>
    blockIndex !== undefined
      ? `block-${blockIndex}-step-${step.stepIndex}`
      : `block-step-${step.stepIndex}`
  );
}
