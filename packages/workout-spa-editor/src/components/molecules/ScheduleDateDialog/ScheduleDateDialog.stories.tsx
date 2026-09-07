import type { Meta, StoryObj } from "@storybook/react";

import { ScheduleDateDialog } from "./ScheduleDateDialog";

const meta = {
  title: "Molecules/ScheduleDateDialog",
  component: ScheduleDateDialog,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof ScheduleDateDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state — date defaults to today, ready to confirm.
 */
export const Default: Story = {
  args: {
    open: true,
    templateName: "Full Body Strength",
    onConfirm: (date) => console.log("onConfirm", date),
    onCancel: () => console.log("onCancel"),
  },
};

/**
 * A long template name wraps inside the quoted confirmation line
 * instead of overflowing the dialog.
 */
export const LongTemplateName: Story = {
  args: {
    open: true,
    templateName:
      "12-Week Marathon Base Build — Week 6 Long Run with Tempo Finish",
    onConfirm: (date) => console.log("onConfirm", date),
    onCancel: () => console.log("onCancel"),
  },
};

/**
 * Closed state — the dialog renders nothing while `open` is false.
 */
export const Closed: Story = {
  args: {
    open: false,
    templateName: "Full Body Strength",
    onConfirm: (date) => console.log("onConfirm", date),
    onCancel: () => console.log("onCancel"),
  },
};
