import type { RepetitionBlock, WorkoutStep } from "../../../types/krd";
import { RepetitionBlockCard } from "../../molecules/RepetitionBlockCard/RepetitionBlockCard";
import { StepCard } from "../../molecules/StepCard/StepCard";

type RenderStepProps = {
  step: WorkoutStep;
  selectedStepId?: string | null;
  selectedStepIds?: Array<string>;
  onStepSelect?: (stepIndex: number) => void;
  onToggleStepSelection?: (stepIndex: number) => void;
  onStepDelete?: (stepIndex: number) => void;
  onStepDuplicate?: (stepIndex: number) => void;
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

type RenderRepetitionBlockProps = {
  block: RepetitionBlock;
  blockIndex: number;
  selectedStepId?: string | null;
  onStepSelect?: (stepIndex: number) => void;
  onStepDelete?: (stepIndex: number) => void;
  onEditRepeatCount?: (count: number) => void;
  onAddStep?: () => void;
};

export const renderRepetitionBlock = ({
  block,
  blockIndex,
  selectedStepId,
  onStepSelect,
  onStepDelete,
  onEditRepeatCount,
  onAddStep,
}: RenderRepetitionBlockProps) => {
  // Extract selected step index from selectedStepId (format: "step-{index}")
  const selectedStepIndex = selectedStepId?.startsWith("step-")
    ? parseInt(selectedStepId.split("-")[1], 10)
    : undefined;

  return (
    <RepetitionBlockCard
      key={`block-${blockIndex}`}
      block={block}
      selectedStepIndex={selectedStepIndex}
      onSelectStep={onStepSelect}
      onRemoveStep={onStepDelete}
      onEditRepeatCount={onEditRepeatCount}
      onAddStep={onAddStep}
    />
  );
};
