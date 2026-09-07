import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { CreateRepetitionBlockButton } from "./CreateRepetitionBlockButton";

const meta = {
  title: "Molecules/CreateRepetitionBlockButton",
  component: CreateRepetitionBlockButton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof CreateRepetitionBlockButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoStepsSelected: Story = {
  args: {
    selectedCount: 2,
    onClick: fn(),
  },
};

export const FiveStepsSelected: Story = {
  name: "Five steps selected (count in the label)",
  args: {
    selectedCount: 5,
    onClick: fn(),
  },
};

export const Disabled: Story = {
  name: "Disabled (selection already inside a repetition block)",
  args: {
    selectedCount: 3,
    onClick: fn(),
    disabled: true,
  },
};

export const BelowThreshold: Story = {
  name: "Fewer than 2 steps selected (renders nothing)",
  args: {
    selectedCount: 1,
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          "The component returns `null` below a 2-step selection — this canvas is intentionally empty, not a broken story.",
      },
    },
  },
};
