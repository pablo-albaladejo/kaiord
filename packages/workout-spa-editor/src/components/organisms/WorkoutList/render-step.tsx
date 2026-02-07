import { SortableStepCard } from "./SortableStepCard";
import type { WorkoutStep } from "../../../types/krd";

type RenderStepProps = {
  readonly id: string;
  readonly step: WorkoutStep;
  readonly visualIndex: number;
  readonly selectedStepId?: string | null;
  readonly selectedStepIds?: readonly string[];
  readonly onStepSelect?: (stepId: string) => void;
  readonly onToggleStepSelection?: (stepId: string) => void;
  readonly onStepDelete?: (stepIndex: number) => void;
  readonly onStepDuplicate?: (stepIndex: number) => void;
  readonly onStepCopy?: (stepIndex: number) => void;
};

export const renderStep = ({
  id,
  step,
  visualIndex,
  selectedStepId,
  selectedStepIds = [],
  onStepSelect,
  onToggleStepSelection,
  onStepDelete,
  onStepDuplicate,
  onStepCopy,
}: RenderStepProps) => {
  const isSelected = selectedStepId === id;
  const isMultiSelected = selectedStepIds.includes(id);

  return (
    <SortableStepCard
      id={id}
      step={step}
      visualIndex={visualIndex}
      isSelected={isSelected}
      isMultiSelected={isMultiSelected}
      onSelect={onStepSelect ? () => onStepSelect(id) : undefined}
      onToggleMultiSelect={
        onToggleStepSelection ? () => onToggleStepSelection(id) : undefined
      }
      onDelete={onStepDelete ? () => onStepDelete(step.stepIndex) : undefined}
      onDuplicate={
        onStepDuplicate ? () => onStepDuplicate(step.stepIndex) : undefined
      }
      onCopy={onStepCopy ? () => onStepCopy(step.stepIndex) : undefined}
    />
  );
};
