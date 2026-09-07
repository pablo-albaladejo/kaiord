import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { BackButton } from "./BackButton";

const meta = {
  title: "Atoms/BackButton",
  component: BackButton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof BackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { onClick: fn() },
};

export const CustomTestId: Story = {
  args: { onClick: fn(), testId: "back-to-library" },
};

export const InHeader: Story = {
  args: { onClick: fn() },
  render: (args) => (
    <header className="flex items-center gap-2 border-b border-edge px-4 py-2">
      <BackButton {...args} />
      <span className="text-sm font-medium text-ink-strong">
        Workout Editor
      </span>
    </header>
  ),
};
