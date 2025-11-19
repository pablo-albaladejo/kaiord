import type { RepetitionBlock } from "../../../types/krd";
import { RepetitionBlockCard } from "../../molecules/RepetitionBlockCard/RepetitionBlockCard";

type RenderRepetitionBlockProps = {
  readonly block: RepetitionBlock;
  readonly blockIndex: number;
  readonly selectedStepId?: string | null;
  readonly onStepSelect?: (stepIndex: number) => void;
  readonly onStepDelete?: (stepIndex: number) => void;
  readonly onStepDuplicate?: (blockIndex: number, stepIndex: number) => void;
  readonly onEditRepeatCount?: (count: number) => void;
  readonly onAddStep?: () => void;
};

export const renderRepetitionBlock = ({
  block,
  blockIndex,
  selectedStepId,
  onStepSelect,
  onStepDelete,
  onStepDuplicate,
  onEditRepeatCount,
  onAddStep,
}: RenderRepetitionBlockProps) => {
  // Extract selected step index from selectedStepId (format: "step-{index}")
  const selectedStepIndex = selectedStepId?.startsWith("step-")
    ? Number.parseInt(selectedStepId.split("-")[1], 10)
    : undefined;

  return (
    <RepetitionBlockCard
      key={`block-${blockIndex}`}
      block={block}
      selectedStepIndex={selectedStepIndex}
      onSelectStep={onStepSelect}
      onRemoveStep={onStepDelete}
      onDuplicateStep={
        onStepDuplicate
          ? (stepIndex: number) => onStepDuplicate(blockIndex, stepIndex)
          : undefined
      }
      onEditRepeatCount={onEditRepeatCount}
      onAddStep={onAddStep}
    />
  );
};
