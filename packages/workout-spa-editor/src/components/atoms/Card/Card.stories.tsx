import type { Meta, StoryObj } from "@storybook/react";

import { Card } from "./Card";

const meta = {
  title: "Atoms/Card",
  component: Card,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: "p-4",
    children: "Card content",
  },
};

export const Interactive: Story = {
  args: {
    variant: "interactive",
    className: "p-4",
    children: "Hover to see the elevation change",
  },
};

export const WithRealisticContent: Story = {
  args: {
    className: "w-72 p-4",
    children: (
      <div className="grid gap-1">
        <span className="font-medium text-ink-strong">FTP test</span>
        <span className="text-sm text-ink-muted">1h 0m · Indoor cycling</span>
      </div>
    ),
  },
};

export const WithCustomClassName: Story = {
  args: {
    className: "w-72 border-zone-4 p-4",
    children: "Custom border color via className",
  },
};
