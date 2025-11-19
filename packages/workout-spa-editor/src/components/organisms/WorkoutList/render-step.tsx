import type { WorkoutStep } from "../../../types/krd";
import { StepCard } from "../../molecules/StepCard/StepCard";

type RenderStepProps = {
  readonly step: WorkoutStep;
  readonly selectedStepId?: string | null;
  readonly selectedStepIds?: readonly string[];
  readonly onStepSelect?: (stepIndex: number) => void;
  readonly onToggleStepSelection?: (stepIndex: number) => void;
  readonly onStepDelete?: (stepIndex: number) => void;
  readonly onStepDuplicate?: (stepIndex: number) => void;
};

export const renderStep = ({
  step,
  selectedStepId,
  selectedStepIds = [],
  onStepSelect,
  onToggleStepSelection,
  onStepDelete,
  onStepDuplicate,
}: RenderStepProps) => {
  const stepId = `step-${step.stepIndex}`;
  const isSelected = selectedStepId === stepId;
  const isMultiSelected = selectedStepIds.includes(stepId);

  return (
    <StepCard
      key={stepId}
      step={step}
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
