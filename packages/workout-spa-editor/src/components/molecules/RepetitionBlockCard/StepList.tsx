import { SortableStep } from "./SortableStep";
import type { WorkoutStep } from "../../../types/krd";

type StepListProps = {
  steps: WorkoutStep[];
  sortableIds: string[];
  selectedStepIndex?: number;
  selectedStepIds?: readonly string[];
  onSelectStep?: (stepId: string) => void;
  onToggleStepSelection?: (stepId: string) => void;
  onRemoveStep?: (index: number) => void;
  onDuplicateStep?: (index: number) => void;
};

export const StepList = ({
  steps,
  sortableIds,
  selectedStepIndex,
  selectedStepIds = [],
  onSelectStep,
  onToggleStepSelection,
  onRemoveStep,
  onDuplicateStep,
}: StepListProps) => (
  <>
    {steps.map((step, index) => {
      const stepId = sortableIds[index];
      return (
        <SortableStep
          key={stepId}
          id={stepId}
          step={step}
          isSelected={selectedStepIndex === index}
          isMultiSelected={selectedStepIds.includes(stepId)}
          onSelect={() => onSelectStep?.(stepId)}
          onToggleMultiSelect={() => onToggleStepSelection?.(stepId)}
          onDelete={onRemoveStep ? () => onRemoveStep(index) : undefined}
          onDuplicate={
            onDuplicateStep ? () => onDuplicateStep(index) : undefined
          }
        />
      );
    })}
  </>
);
