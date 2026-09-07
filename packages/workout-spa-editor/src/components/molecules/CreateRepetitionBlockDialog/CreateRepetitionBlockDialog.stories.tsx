import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "storybook/test";

import { CreateRepetitionBlockDialog } from "./CreateRepetitionBlockDialog";

const meta = {
  title: "Molecules/CreateRepetitionBlockDialog",
  component: CreateRepetitionBlockDialog,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof CreateRepetitionBlockDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state: dialog open with a step count and the default repeat
 * count of 2.
 */
export const Default: Story = {
  args: {
    isOpen: true,
    stepCount: 5,
    onConfirm: (repeatCount) => console.log("onConfirm", repeatCount),
    onCancel: () => console.log("onCancel"),
  },
};

/**
 * `stepCount` is optional — the dialog omits the "N steps" hint when
 * the caller does not supply one.
 */
export const WithoutStepCount: Story = {
  args: {
    isOpen: true,
    onConfirm: (repeatCount) => console.log("onConfirm", repeatCount),
    onCancel: () => console.log("onCancel"),
  },
};

/**
 * Filled state: the user has typed a multi-digit repeat count.
 */
export const FilledHighCount: Story = {
  args: {
    isOpen: true,
    stepCount: 3,
    onConfirm: (repeatCount) => console.log("onConfirm", repeatCount),
    onCancel: () => console.log("onCancel"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("spinbutton");
    await userEvent.clear(input);
    await userEvent.type(input, "10");
  },
};

/**
 * Validation error: a repeat count below 2 is rejected inline.
 */
export const ValidationError: Story = {
  args: {
    isOpen: true,
    stepCount: 4,
    onConfirm: (repeatCount) => console.log("onConfirm", repeatCount),
    onCancel: () => console.log("onCancel"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("spinbutton");
    await userEvent.clear(input);
    await userEvent.type(input, "0");
    await userEvent.click(canvas.getByRole("button", { name: /create/i }));
  },
};
