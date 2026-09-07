import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { Toast } from "./Toast";
import { ToastProvider } from "./ToastProvider";

const meta = {
  title: "Atoms/Toast",
  component: Toast,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    title: "Workout saved",
    description: "Your changes were saved to the library.",
    variant: "success",
    open: true,
    onOpenChange: fn(),
    duration: Infinity,
  },
};

export const Warning: Story = {
  args: {
    title: "Unreachable target",
    description: "This step targets a zone outside the athlete's FTP range.",
    variant: "warning",
    open: true,
    onOpenChange: fn(),
    duration: Infinity,
  },
};

export const Error: Story = {
  args: {
    title: "Save failed",
    description: "The workout could not be written to the library.",
    variant: "error",
    open: true,
    onOpenChange: fn(),
    duration: Infinity,
  },
};

export const Info: Story = {
  args: {
    title: "Synced with Garmin Connect",
    variant: "info",
    open: true,
    onOpenChange: fn(),
    duration: Infinity,
  },
};

export const WithAction: Story = {
  args: {
    title: "Step deleted",
    description: "Removed from the workout.",
    variant: "info",
    open: true,
    onOpenChange: fn(),
    duration: Infinity,
    action: <button type="button">Undo</button>,
  },
};
