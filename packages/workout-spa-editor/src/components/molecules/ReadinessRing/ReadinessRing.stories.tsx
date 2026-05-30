import type { Meta, StoryObj } from "@storybook/react";

import { ReadinessRing } from "./ReadinessRing";

const meta = {
  title: "Molecules/ReadinessRing",
  component: ReadinessRing,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    score: {
      description: "Readiness score 0–100",
      control: { type: "number", min: 0, max: 100 },
    },
    size: {
      description: "Diameter in pixels",
      control: { type: "number" },
    },
    label: {
      description: "Label shown below the score",
      control: { type: "text" },
    },
    className: {
      description: "Additional CSS classes",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof ReadinessRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    score: 72,
  },
};

export const High: Story = {
  args: {
    score: 95,
  },
};

export const Low: Story = {
  args: {
    score: 25,
  },
};

export const CustomLabel: Story = {
  args: {
    score: 60,
    label: "HRV",
  },
};

export const Large: Story = {
  args: {
    score: 80,
    size: 120,
  },
};
