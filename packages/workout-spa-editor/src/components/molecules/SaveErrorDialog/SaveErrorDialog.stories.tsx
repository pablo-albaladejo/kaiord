import type { Meta, StoryObj } from "@storybook/react";
import { SaveErrorDialog } from "./SaveErrorDialog";

const meta = {
  title: "Molecules/SaveErrorDialog",
  component: SaveErrorDialog,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    errors: {
      description: "Array of validation errors",
      control: { type: "object" },
    },
    onClose: {
      description: "Callback when dialog is closed",
      action: "closed",
    },
    onRetry: {
      description: "Callback when retry is clicked",
      action: "retry",
    },
  },
} satisfies Meta<typeof SaveErrorDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default error dialog with single validation error
 */
export const Default: Story = {
  args: {
    errors: [{ path: ["metadata"], message: "Required field missing" }],
    onClose: () => console.log("Dialog closed"),
    onRetry: () => console.log("Retry clicked"),
  },
};

/**
 * Error dialog with multiple validation errors
 */
export const MultipleErrors: Story = {
  args: {
    errors: [
      { path: ["version"], message: "Required field missing" },
      { path: ["type"], message: "Invalid value" },
      { path: ["metadata", "sport"], message: "Must be a valid sport type" },
    ],
    onClose: () => console.log("Dialog closed"),
    onRetry: () => console.log("Retry clicked"),
  },
};

/**
 * Error dialog with nested path errors
 */
export const NestedPathErrors: Story = {
  args: {
    errors: [
      {
        path: ["extensions", "structured_workout", "steps", "0", "duration"],
        message: "Duration must be positive",
      },
      {
        path: [
          "extensions",
          "structured_workout",
          "steps",
          "1",
          "target",
          "value",
        ],
        message: "Target value out of range",
      },
      {
        path: ["metadata", "created"],
        message: "Invalid date format",
      },
    ],
    onClose: () => console.log("Dialog closed"),
    onRetry: () => console.log("Retry clicked"),
  },
};

/**
 * Error dialog with many errors (scrollable)
 */
export const ManyErrors: Story = {
  args: {
    errors: [
      { path: ["version"], message: "Required field missing" },
      { path: ["type"], message: "Invalid value" },
      { path: ["metadata", "sport"], message: "Must be a valid sport type" },
      { path: ["metadata", "created"], message: "Invalid date format" },
      {
        path: ["extensions", "structured_workout", "name"],
        message: "Name is required",
      },
      {
        path: ["extensions", "structured_workout", "steps", "0"],
        message: "Step is invalid",
      },
      {
        path: ["extensions", "structured_workout", "steps", "1"],
        message: "Step is invalid",
      },
      {
        path: ["extensions", "structured_workout", "steps", "2"],
        message: "Step is invalid",
      },
      {
        path: ["extensions", "structured_workout", "steps", "3"],
        message: "Step is invalid",
      },
      {
        path: ["extensions", "structured_workout", "steps", "4"],
        message: "Step is invalid",
      },
    ],
    onClose: () => console.log("Dialog closed"),
    onRetry: () => console.log("Retry clicked"),
  },
};

/**
 * Error dialog with errors without paths
 */
export const ErrorsWithoutPaths: Story = {
  args: {
    errors: [
      { path: [], message: "Workout validation failed" },
      { path: [], message: "Invalid workout structure" },
    ],
    onClose: () => console.log("Dialog closed"),
    onRetry: () => console.log("Retry clicked"),
  },
};

/**
 * Interactive example with state management
 */
export const Interactive: Story = {
  render: () => {
    const handleClose = () => {
      alert("Dialog closed");
    };

    const handleRetry = () => {
      alert("Retrying save...");
    };

    return (
      <SaveErrorDialog
        errors={[
          { path: ["metadata"], message: "Required field missing" },
          { path: ["type"], message: "Invalid value" },
        ]}
        onClose={handleClose}
        onRetry={handleRetry}
      />
    );
  },
};
