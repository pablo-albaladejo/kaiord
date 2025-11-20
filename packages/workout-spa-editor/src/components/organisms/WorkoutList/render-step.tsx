import type { WorkoutStep } from "../../../types/krd";
import { SortableStepCard } from "./SortableStepCard";

type RenderStepProps = {
  readonly id: string;
  readonly step: WorkoutStep;
  readonly visualIndex: number;
  readonly selectedStepId?: string | null;
  readonly selectedStepIds?: readonly string[];
  readonly onStepSelect?: (stepIndex: number) => void;
  readonly onToggleStepSelection?: (stepIndex: number) => void;
  readonly onStepDelete?: (stepIndex: number) => void;
  readonly onStepDuplicate?: (stepIndex: number) => void;
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
}: RenderStepProps) => {
  const isSelected = selectedStepId === id;
  const isMultiSelected = selectedStepIds.includes(id);

  return (
    <SortableStepCard
      key={id}
      id={id}
      step={step}
      visualIndex={visualIndex}
      isSelected={isSelected}
      isMultiSelected={isMultiSelected}
      onSelect={onStepSelect ? () => onStepSelect(step.stepIndex) : undefined}
      onToggleMultiSelect={
        onToggleStepSelection
          ? () => onToggleStepSelection(step.stepIndex)
          : undefined
      }
      onDelete={onStepDelete ? () => onStepDelete(step.stepIndex) : undefined}
      onDuplicate={
        onStepDuplicate ? () => onStepDuplicate(step.stepIndex) : undefined
      }
    />
  );
};
