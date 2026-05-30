import type { Meta, StoryObj } from "@storybook/react";

import { Pill } from "./Pill";

const meta = {
  title: "Atoms/Pill",
  component: Pill,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    tone: {
      description: "Color tone",
      control: { type: "select" },
      options: ["neutral", "accent", "accentSolid"],
    },
  },
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { tone: "neutral", children: "All" } };
export const Accent: Story = { args: { tone: "accent", children: "AI" } };
export const AccentSolid: Story = {
  args: { tone: "accentSolid", children: "Cycling" },
};
export const WithIcon: Story = {
  args: { tone: "accent", icon: "plus", children: "Connect" },
};
