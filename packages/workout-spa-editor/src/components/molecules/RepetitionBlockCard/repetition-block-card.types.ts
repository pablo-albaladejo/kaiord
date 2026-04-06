import type { HTMLAttributes } from "react";

import type { RepetitionBlock } from "../../../types/krd";
import type { DragHandleProps } from "../StepCard/StepCard";

/**
 * Props for the RepetitionBlockCard component.
 *
 * This component displays a repetition block with its contained steps.
 * Each block has a unique ID that persists across operations.
 *
 * @property block - The repetition block to display (must have a unique `id`)
 * @property onEditRepeatCount - Callback when repeat count is edited
 * @property onAddStep - Callback to add a new step to the block
 * @property onRemoveStep - Callback to remove a step by index
 * @property onDuplicateStep - Callback to duplicate a step by index
 * @property onSelectStep - Callback when a step is selected
 * @property onToggleStepSelection - Callback to toggle step selection
 * @property onReorderSteps - Callback when steps are reordered via drag-and-drop
 * @property onUngroup - Callback to ungroup the block into individual steps
 * @property onDelete - Callback to delete the entire block (uses block.id)
 * @property selectedStepIndex - Currently selected step index
 * @property selectedStepIds - Set of selected step IDs
 * @property isDragging - Whether the block is currently being dragged
 * @property dragHandleProps - Props for the drag handle (from dnd-kit)
 * @property blockIndex - Visual index of the block (for display only)
 */
export type RepetitionBlockCardProps = HTMLAttributes<HTMLDivElement> & {
  block: RepetitionBlock;
  onEditRepeatCount?: (count: number) => void;
  onAddStep?: () => void;
  onRemoveStep?: (index: number) => void;
  onDuplicateStep?: (index: number) => void;
  onSelectStep?: (stepId: string) => void;
  onBlockSelect?: (blockId: string) => void;
  onToggleStepSelection?: (stepId: string) => void;
  onReorderSteps?: (activeIndex: number, overIndex: number) => void;
  onUngroup?: () => void;
  onDelete?: () => void;
  selectedStepIndex?: number;
  selectedStepIds?: readonly string[];
  isDragging?: boolean;
  dragHandleProps?: DragHandleProps;
  blockIndex?: number;
};
