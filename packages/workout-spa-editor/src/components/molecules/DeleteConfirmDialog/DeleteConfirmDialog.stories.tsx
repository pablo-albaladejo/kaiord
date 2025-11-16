import type { Meta, StoryObj } from "@storybook/react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

const meta = {
  title: "Molecules/DeleteConfirmDialog",
  component: DeleteConfirmDialog,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    stepIndex: {
      description: "Index of the step to delete (0-based)",
      control: { type: "number" },
    },
    onConfirm: {
      description: "Callback when delete is confirmed",
      action: "confirmed",
    },
    onCancel: {
      description: "Callback when delete is cancelled",
      action: "cancelled",
    },
  },
} satisfies Meta<typeof DeleteConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default delete confirmation dialog for first step
 */
export const Default: Story = {
  args: {
    stepIndex: 0,
    onConfirm: () => console.log("Delete confirmed"),
    onCancel: () => console.log("Delete cancelled"),
  },
};

/**
 * Delete confirmation for step in the middle of workout
 */
export const MiddleStep: Story = {
  args: {
    stepIndex: 5,
    onConfirm: () => console.log("Delete confirmed"),
    onCancel: () => console.log("Delete cancelled"),
  },
};

/**
 * Delete confirmation for last step
 */
export const LastStep: Story = {
  args: {
    stepIndex: 9,
    onConfirm: () => console.log("Delete confirmed"),
    onCancel: () => console.log("Delete cancelled"),
  },
};

/**
 * Interactive example with state management
 */
export const Interactive: Story = {
  render: () => {
    const handleConfirm = () => {
      alert("Step deleted!");
    };

    const handleCancel = () => {
      alert("Delete cancelled");
    };

    return (
      <DeleteConfirmDialog
        stepIndex={3}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  },
};
