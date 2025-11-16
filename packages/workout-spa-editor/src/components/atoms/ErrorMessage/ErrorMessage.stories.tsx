import type { Meta, StoryObj } from "@storybook/react";
import { ErrorMessage } from "./ErrorMessage";

const meta = {
  title: "Atoms/ErrorMessage",
  component: ErrorMessage,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      description: "Error title",
      control: { type: "text" },
    },
    message: {
      description: "Error message",
      control: { type: "text" },
    },
    validationErrors: {
      description: "Array of validation errors",
      control: { type: "object" },
    },
    onRetry: {
      description: "Callback when retry button is clicked",
      action: "retry",
    },
    onDismiss: {
      description: "Callback when dismiss button is clicked",
      action: "dismiss",
    },
    className: {
      description: "Additional CSS classes",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof ErrorMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default error message with title only
 */
export const Default: Story = {
  args: {
    title: "An error occurred",
  },
};

/**
 * Error message with title and description
 */
export const WithMessage: Story = {
  args: {
    title: "Failed to load workout",
    message: "The file could not be parsed. Please check the file format.",
  },
};

/**
 * Error message with validation errors
 */
export const WithValidationErrors: Story = {
  args: {
    title: "Validation Failed",
    message: "The workout contains invalid data:",
    validationErrors: [
      { path: ["version"], message: "Required field missing" },
      { path: ["type"], message: "Invalid value" },
      { path: ["metadata", "sport"], message: "Must be a valid sport type" },
    ],
  },
};

/**
 * Error message with retry action
 */
export const WithRetry: Story = {
  args: {
    title: "Network Error",
    message: "Failed to connect to the server. Please try again.",
    onRetry: () => console.log("Retry clicked"),
  },
};

/**
 * Error message with dismiss action
 */
export const WithDismiss: Story = {
  args: {
    title: "Warning",
    message: "Some features may not work correctly.",
    onDismiss: () => console.log("Dismiss clicked"),
  },
};

/**
 * Error message with both retry and dismiss actions
 */
export const WithBothActions: Story = {
  args: {
    title: "Save Failed",
    message: "The workout could not be saved. Please try again.",
    onRetry: () => console.log("Retry clicked"),
    onDismiss: () => console.log("Dismiss clicked"),
  },
};

/**
 * Complex error with validation errors and actions
 */
export const ComplexError: Story = {
  args: {
    title: "Invalid Workout Data",
    message: "Please fix the following errors and try again:",
    validationErrors: [
      {
        path: ["steps", "0", "duration"],
        message: "Duration must be positive",
      },
      {
        path: ["steps", "1", "target", "value"],
        message: "Target value out of range",
      },
      { path: ["metadata", "created"], message: "Invalid date format" },
    ],
    onRetry: () => console.log("Retry clicked"),
    onDismiss: () => console.log("Dismiss clicked"),
  },
};

/**
 * Error message with custom styling
 */
export const CustomStyling: Story = {
  args: {
    title: "Custom Error",
    message: "This error has custom styling applied.",
    className: "max-w-md",
  },
};
