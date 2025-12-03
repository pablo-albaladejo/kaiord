import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "../../atoms/Button/Button";
import { ConfirmationModal } from "./ConfirmationModal";

/**
 * ConfirmationModal is a reusable modal dialog component for user confirmations.
 * It provides focus trap, backdrop dismissal, and keyboard accessibility.
 *
 * ## Features
 * - Focus trap (keyboard navigation stays within modal)
 * - Backdrop click to dismiss
 * - Escape key to dismiss
 * - Focus restoration after dismissal
 * - Accessible (WCAG 2.1 AA compliant)
 * - Responsive (adapts to mobile screens)
 * - Themeable (supports light, dark, and custom themes)
 *
 * ## Usage
 * ```tsx
 * <ConfirmationModal
 *   isOpen={true}
 *   title="Delete Workout?"
 *   message="This action cannot be undone."
 *   confirmLabel="Delete"
 *   cancelLabel="Cancel"
 *   onConfirm={() => console.log("Confirmed")}
 *   onCancel={() => console.log("Cancelled")}
 *   variant="destructive"
 * />
 * ```
 */
const meta = {
  title: "Molecules/ConfirmationModal",
  component: ConfirmationModal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A modal dialog component for user confirmations. Replaces browser-native alerts with accessible, themeable dialogs.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Controls modal visibility",
    },
    title: {
      control: "text",
      description: "Modal title displayed in header",
    },
    message: {
      control: "text",
      description: "Modal message displayed in body",
    },
    confirmLabel: {
      control: "text",
      description: "Text for confirm button",
    },
    cancelLabel: {
      control: "text",
      description: "Text for cancel button",
    },
    variant: {
      control: "select",
      options: ["default", "destructive"],
      description: "Visual style (default: blue, destructive: red)",
    },
    onConfirm: {
      action: "confirmed",
      description: "Callback when user confirms",
    },
    onCancel: {
      action: "cancelled",
      description: "Callback when user cancels or dismisses",
    },
  },
} satisfies Meta<typeof ConfirmationModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default confirmation modal with standard styling.
 * Use for non-destructive actions like saving or confirming changes.
 */
export const Default: Story = {
  args: {
    isOpen: true,
    title: "Save Changes?",
    message:
      "You have unsaved changes. Would you like to save before continuing?",
    confirmLabel: "Save",
    cancelLabel: "Cancel",
    variant: "default",
    onConfirm: () => console.log("Confirmed"),
    onCancel: () => console.log("Cancelled"),
  },
};

/**
 * Destructive confirmation modal with warning styling.
 * Use for permanent actions like deletions or data loss warnings.
 */
export const Destructive: Story = {
  args: {
    isOpen: true,
    title: "Delete Workout?",
    message:
      "This will permanently delete the workout. This action cannot be undone.",
    confirmLabel: "Delete Workout",
    cancelLabel: "Cancel",
    variant: "destructive",
    onConfirm: () => console.log("Confirmed"),
    onCancel: () => console.log("Cancelled"),
  },
};

/**
 * Short message example.
 * Demonstrates modal with minimal content.
 */
export const ShortMessage: Story = {
  args: {
    isOpen: true,
    title: "Delete Step?",
    message: "Are you sure?",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    variant: "destructive",
    onConfirm: () => console.log("Confirmed"),
    onCancel: () => console.log("Cancelled"),
  },
};

/**
 * Long message example.
 * Demonstrates modal with extensive content that may require scrolling.
 */
export const LongMessage: Story = {
  args: {
    isOpen: true,
    title: "Important Notice",
    message:
      "This is a very long message that demonstrates how the modal handles extensive content. " +
      "The modal will automatically adjust its height and may become scrollable if the content " +
      "exceeds the available viewport space. This ensures that all content remains accessible " +
      "even on smaller screens or when the message is particularly lengthy. The modal maintains " +
      "its responsive design and accessibility features regardless of content length.",
    confirmLabel: "I Understand",
    cancelLabel: "Cancel",
    variant: "default",
    onConfirm: () => console.log("Confirmed"),
    onCancel: () => console.log("Cancelled"),
  },
};

/**
 * Interactive example with state management.
 * Demonstrates how to use the modal with a trigger button.
 */
export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="flex flex-col items-center gap-4">
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

        <ConfirmationModal
          isOpen={isOpen}
          title="Confirm Action"
          message="Are you sure you want to proceed with this action?"
          confirmLabel="Proceed"
          cancelLabel="Cancel"
          variant="default"
          onConfirm={() => {
            console.log("Confirmed");
            setIsOpen(false);
          }}
          onCancel={() => {
            console.log("Cancelled");
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

/**
 * Discard changes warning example.
 * Common use case for warning users about unsaved changes.
 */
export const DiscardChanges: Story = {
  args: {
    isOpen: true,
    title: "Discard Changes?",
    message:
      "You have unsaved changes. If you leave now, your changes will be lost.",
    confirmLabel: "Discard",
    cancelLabel: "Keep Editing",
    variant: "destructive",
    onConfirm: () => console.log("Confirmed"),
    onCancel: () => console.log("Cancelled"),
  },
};

/**
 * Delete repetition block example.
 * Specific use case from the repetition block deletion feature.
 */
export const DeleteRepetitionBlock: Story = {
  args: {
    isOpen: true,
    title: "Delete Repetition Block?",
    message:
      "This will delete the entire block and all its contained steps. You can undo this action with Ctrl+Z.",
    confirmLabel: "Delete Block",
    cancelLabel: "Cancel",
    variant: "destructive",
    onConfirm: () => console.log("Confirmed"),
    onCancel: () => console.log("Cancelled"),
  },
};

/**
 * Closed state example.
 * Demonstrates the modal in its closed state (not visible).
 */
export const Closed: Story = {
  args: {
    isOpen: false,
    title: "This Won't Show",
    message: "The modal is closed",
    confirmLabel: "OK",
    cancelLabel: "Cancel",
    variant: "default",
    onConfirm: () => console.log("Confirmed"),
    onCancel: () => console.log("Cancelled"),
  },
};
