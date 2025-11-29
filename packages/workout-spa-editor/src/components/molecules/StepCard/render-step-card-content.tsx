import { DragHandle } from "./DragHandle";
import type { StepCardProps } from "./StepCard.types";
import { StepCardActions } from "./StepCardActions";
import { StepCardFooter } from "./StepCardFooter";
import { StepDetails } from "./StepDetails";
import { StepHeader } from "./StepHeader";

type RenderStepCardContentProps = {
  step: StepCardProps["step"];
  displayIndex: number;
  intensity:
    | "warmup"
    | "active"
    | "cooldown"
    | "rest"
    | "recovery"
    | "interval"
    | "other";
  dragHandleProps?: StepCardProps["dragHandleProps"];
  isDragging: boolean;
  onDelete?: StepCardProps["onDelete"];
  onDuplicate?: StepCardProps["onDuplicate"];
  onCopy?: StepCardProps["onCopy"];
};

export const renderStepCardContent = ({
  step,
  displayIndex,
  intensity,
  dragHandleProps,
  isDragging,
  onDelete,
  onDuplicate,
  onCopy,
}: RenderStepCardContentProps) => (
  <>
    {dragHandleProps && (
      <DragHandle isDragging={isDragging} {...dragHandleProps} />
    )}
    <StepCardActions
      stepIndex={step.stepIndex}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onCopy={onCopy}
    />
    <StepHeader
      stepName={step.name || `Step ${displayIndex + 1}`}
      intensity={intensity}
    />
    <StepDetails step={step} />
    <StepCardFooter step={step} />
  </>
);
