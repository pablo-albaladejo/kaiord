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

/**
 * Build sortable ids for a block's inner steps. Prefers the step's own
 * stable `ItemId`; falls back to position-based strings when a test
 * harness passes raw `WorkoutStep`s without ids (production flows go
 * through `hydrateUIWorkout`, which guarantees every step has one).
 */
export function buildSortableIds(
  steps: WorkoutStep[],
  blockIndex?: number
): string[] {
  return steps.map((step) => {
    const id = (step as { id?: string }).id;
    if (id) return id;
    return blockIndex !== undefined
      ? `block-${blockIndex}-step-${step.stepIndex}`
      : `block-step-${step.stepIndex}`;
  });
}
