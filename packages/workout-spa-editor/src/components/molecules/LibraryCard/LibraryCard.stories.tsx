import type { Meta, StoryObj } from "@storybook/react";

import { LibraryCard } from "./LibraryCard";

const meta = {
  title: "Molecules/LibraryCard",
  component: LibraryCard,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof LibraryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    title: "Sweet Spot Intervals",
    sport: "cycling",
    duration: "1:00:00",
    tss: 78,
    dist: [0.2, 0.3, 0.3, 0.15, 0.05],
    tag: "Threshold",
    onClick: () => undefined,
  },
};

export const NoZones: Story = {
  args: {
    title: "Easy Recovery Spin",
    sport: "cycling",
    duration: "0:45:00",
    tss: 30,
    onClick: () => undefined,
  },
};

export const Running: Story = {
  args: {
    title: "Tempo Run",
    sport: "running",
    duration: "0:40:00",
    tss: 55,
    dist: [0.1, 0.2, 0.5, 0.15, 0.05],
    onClick: () => undefined,
  },
};

export const MetaOnly: Story = {
  args: {
    title: "Untracked Workout",
    sport: "swimming",
    onClick: () => undefined,
  },
};
