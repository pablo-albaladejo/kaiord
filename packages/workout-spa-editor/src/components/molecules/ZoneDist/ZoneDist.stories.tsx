import type { Meta, StoryObj } from "@storybook/react";

import { ZoneDist } from "./ZoneDist";

const meta = {
  title: "Molecules/ZoneDist",
  component: ZoneDist,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    dist: {
      description: "5 fractions (one per zone Z1..Z5); values <= 0 are skipped",
    },
    height: {
      description: "Bar height in px (default 8)",
      control: { type: "number" },
    },
    className: {
      description: "Additional CSS classes",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof ZoneDist>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    dist: [0.2, 0.3, 0.2, 0.2, 0.1],
    height: 8,
  },
};

export const Thick: Story = {
  args: {
    dist: [0.1, 0.2, 0.4, 0.2, 0.1],
    height: 16,
  },
};

export const Zone1Only: Story = {
  args: {
    dist: [1, 0, 0, 0, 0],
    height: 8,
  },
};

export const Zone5Heavy: Story = {
  args: {
    dist: [0.05, 0.1, 0.15, 0.3, 0.4],
    height: 8,
  },
};

export const SparseZones: Story = {
  args: {
    dist: [0.4, 0, 0.4, 0, 0.2],
    height: 8,
  },
};
