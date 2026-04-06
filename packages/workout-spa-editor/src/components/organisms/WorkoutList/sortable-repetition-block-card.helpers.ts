import { CSS } from "@dnd-kit/utilities";
import type { SortableRepetitionBlockCardProps } from "./sortable-repetition-block-card.types";
import type { Transform } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";

type BlockHandlers = {
  handleDuplicate?: (stepIndex: number) => void;
  handleReorder?: (a: number, b: number) => void;
};

/** Build inline style from dnd-kit sortable transform. */
export function buildSortableStyle(
  transform: Transform | null,
  transition: string | undefined,
  isDragging: boolean
): CSSProperties {
  return {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
}

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
