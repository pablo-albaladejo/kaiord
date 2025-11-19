import type { RepetitionBlock, WorkoutStep } from "../../../types/krd";
import { RepetitionBlockCard } from "../../molecules/RepetitionBlockCard/RepetitionBlockCard";
import { StepCard } from "../../molecules/StepCard/StepCard";

type RenderStepProps = {
  step: WorkoutStep;
  selectedStepId?: string | null;
  onStepSelect?: (stepIndex: number) => void;
  onStepDelete?: (stepIndex: number) => void;
  onStepDuplicate?: (stepIndex: number) => void;
};

export const renderStep = ({
  step,
  selectedStepId,
  onStepSelect,
  onStepDelete,
  onStepDuplicate,
}: RenderStepProps) => {
  const isSelected = selectedStepId === `step-${step.stepIndex}`;

  return (
    <StepCard
      key={`step-${step.stepIndex}`}
      step={step}
      isSelected={isSelected}
      onSelect={onStepSelect ? () => onStepSelect(step.stepIndex) : undefined}
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
};

export const renderRepetitionBlock = ({
  block,
  blockIndex,
  selectedStepId,
  onStepSelect,
  onStepDelete,
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
    />
  );
};
