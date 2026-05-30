import type { Meta, StoryObj } from "@storybook/react";

import { SectionHead } from "./SectionHead";

const meta = {
  title: "Molecules/SectionHead",
  component: SectionHead,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      description: "Section heading text (rendered uppercase)",
      control: { type: "text" },
    },
    action: {
      description: "Optional right-side action label",
      control: { type: "text" },
    },
    onAction: {
      description: "Callback fired when the action button is clicked",
      action: "onAction",
    },
    className: {
      description: "Additional CSS classes",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof SectionHead>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default — title only
 */
export const Default: Story = {
  args: {
    title: "Training Load",
  },
};

/**
 * With action link
 */
export const WithAction: Story = {
  args: {
    title: "Weekly Stats",
    action: "See all",
  },
};
