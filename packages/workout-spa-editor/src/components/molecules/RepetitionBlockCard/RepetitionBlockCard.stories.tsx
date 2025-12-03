import type { Meta, StoryObj } from "@storybook/react";
import type { RepetitionBlock } from "../../../types/krd";
import { RepetitionBlockCard } from "./RepetitionBlockCard";

/**
 * RepetitionBlockCard displays a repetition block with its contained steps.
 * It supports editing, expanding/collapsing, adding steps, ungrouping, and deletion.
 *
 * ## Features
 * - Expand/collapse to show/hide steps
 * - Edit repeat count inline
 * - Add new steps to the block
 * - Ungroup block into individual steps
 * - Delete entire block with keyboard shortcuts (Delete/Backspace)
 * - Drag-and-drop reordering (when integrated with DnD context)
 * - Keyboard accessible
 *
 * ## Keyboard Shortcuts
 * - `Delete` or `Backspace`: Delete the block (when focused)
 * - `Enter`: Save repeat count (when editing)
 * - `Escape`: Cancel repeat count edit
 *
 * ## Usage
 * ```tsx
 * <RepetitionBlockCard
 *   block={block}
 *   onEditRepeatCount={(count) => console.log("New count:", count)}
 *   onAddStep={() => console.log("Add step")}
 *   onUngroup={() => console.log("Ungroup")}
 *   onDelete={() => console.log("Delete")}
 * />
 * ```
 */
const meta = {
  title: "Molecules/RepetitionBlockCard",
  component: RepetitionBlockCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A card component for displaying and managing repetition blocks. Supports inline editing, expansion, and deletion.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    block: {
      description: "The repetition block data",
    },
    onEditRepeatCount: {
      action: "edit-repeat-count",
      description: "Callback when repeat count is changed",
    },
    onAddStep: {
      action: "add-step",
      description: "Callback when add step button is clicked",
    },
    onUngroup: {
      action: "ungroup",
      description: "Callback when ungroup button is clicked",
    },
    onDelete: {
      action: "delete",
      description:
        "Callback when delete button is clicked or Delete/Backspace key is pressed",
    },
    selectedStepIndex: {
      control: "number",
      description: "Index of the currently selected step within the block",
    },
    isDragging: {
      control: "boolean",
      description: "Whether the block is currently being dragged",
    },
  },
} satisfies Meta<typeof RepetitionBlockCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample block data
const sampleBlock: RepetitionBlock = {
  repeatCount: 3,
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: {
        type: "time",
        seconds: 300,
      },
      targetType: "power",
      target: {
        type: "power",
        value: {
          unit: "watts",
          value: 200,
        },
      },
      intensity: "active",
    },
    {
      stepIndex: 1,
      durationType: "time",
      duration: {
        type: "time",
        seconds: 60,
      },
      targetType: "power",
      target: {
        type: "power",
        value: {
          unit: "watts",
          value: 300,
        },
      },
      intensity: "active",
    },
  ],
};

const singleStepBlock: RepetitionBlock = {
  repeatCount: 5,
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: {
        type: "time",
        seconds: 180,
      },
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: {
          unit: "zone",
          value: 3,
        },
      },
      intensity: "active",
    },
  ],
};

const emptyBlock: RepetitionBlock = {
  repeatCount: 2,
  steps: [],
};

/**
 * Default repetition block with multiple steps.
 * Shows the block in its expanded state with all interactive features.
 */
export const Default: Story = {
  args: {
    block: sampleBlock,
    onEditRepeatCount: (count) => console.log("Edit repeat count:", count),
    onAddStep: () => console.log("Add step"),
    onUngroup: () => console.log("Ungroup"),
    onDelete: () => console.log("Delete"),
  },
};

/**
 * Block with a single step.
 * Demonstrates the minimum viable block configuration.
 */
export const SingleStep: Story = {
  args: {
    block: singleStepBlock,
    onEditRepeatCount: (count) => console.log("Edit repeat count:", count),
    onAddStep: () => console.log("Add step"),
    onUngroup: () => console.log("Ungroup"),
    onDelete: () => console.log("Delete"),
  },
};

/**
 * Empty block (edge case).
 * In practice, new blocks automatically get a default step,
 * but this demonstrates the UI for an empty block.
 */
export const Empty: Story = {
  args: {
    block: emptyBlock,
    onEditRepeatCount: (count) => console.log("Edit repeat count:", count),
    onAddStep: () => console.log("Add step"),
    onUngroup: () => console.log("Ungroup"),
    onDelete: () => console.log("Delete"),
  },
};

/**
 * Block with selected step.
 * Shows visual feedback when a step within the block is selected.
 */
export const WithSelectedStep: Story = {
  args: {
    block: sampleBlock,
    selectedStepIndex: 0,
    onEditRepeatCount: (count) => console.log("Edit repeat count:", count),
    onAddStep: () => console.log("Add step"),
    onUngroup: () => console.log("Ungroup"),
    onDelete: () => console.log("Delete"),
  },
};

/**
 * Block in dragging state.
 * Shows the visual feedback when the block is being dragged.
 */
export const Dragging: Story = {
  args: {
    block: sampleBlock,
    isDragging: true,
    onEditRepeatCount: (count) => console.log("Edit repeat count:", count),
    onAddStep: () => console.log("Add step"),
    onUngroup: () => console.log("Ungroup"),
    onDelete: () => console.log("Delete"),
  },
};

/**
 * Block with high repeat count.
 * Demonstrates how the UI handles larger numbers.
 */
export const HighRepeatCount: Story = {
  args: {
    block: {
      ...sampleBlock,
      repeatCount: 10,
    },
    onEditRepeatCount: (count) => console.log("Edit repeat count:", count),
    onAddStep: () => console.log("Add step"),
    onUngroup: () => console.log("Ungroup"),
    onDelete: () => console.log("Delete"),
  },
};

/**
 * Block without delete handler.
 * Shows the block when deletion is not available (delete button hidden).
 */
export const WithoutDelete: Story = {
  args: {
    block: sampleBlock,
    onEditRepeatCount: (count) => console.log("Edit repeat count:", count),
    onAddStep: () => console.log("Add step"),
    onUngroup: () => console.log("Ungroup"),
    // No onDelete handler
  },
};

/**
 * Block without ungroup handler.
 * Shows the block when ungrouping is not available (ungroup button hidden).
 */
export const WithoutUngroup: Story = {
  args: {
    block: sampleBlock,
    onEditRepeatCount: (count) => console.log("Edit repeat count:", count),
    onAddStep: () => console.log("Add step"),
    onDelete: () => console.log("Delete"),
    // No onUngroup handler
  },
};

/**
 * Minimal block (no optional handlers).
 * Shows the block with only the required functionality.
 */
export const Minimal: Story = {
  args: {
    block: sampleBlock,
    // No optional handlers
  },
};
