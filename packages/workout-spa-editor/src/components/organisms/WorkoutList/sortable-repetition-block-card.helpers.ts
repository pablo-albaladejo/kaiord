import type { SortableRepetitionBlockCardProps } from "./sortable-repetition-block-card.types";

type BlockHandlers = {
  handleDuplicate?: (stepIndex: number) => void;
  handleReorder?: (a: number, b: number) => void;
};

/** Build scoped handlers that curry the blockIndex. */
export function buildBlockHandlers(
  props: Pick<
    SortableRepetitionBlockCardProps,
    "onStepDuplicate" | "onReorderSteps" | "blockIndex"
  >
): BlockHandlers {
  const { onStepDuplicate, onReorderSteps, blockIndex } = props;
  return {
    handleDuplicate: onStepDuplicate
      ? (stepIndex: number) => onStepDuplicate(blockIndex, stepIndex)
      : undefined,
    handleReorder: onReorderSteps
      ? (a: number, b: number) => onReorderSteps(blockIndex, a, b)
      : undefined,
  };
}
