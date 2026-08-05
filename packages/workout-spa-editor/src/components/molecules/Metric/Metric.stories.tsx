import type { Meta, StoryObj } from "@storybook/react";

import { Metric } from "./Metric";

const meta = {
  title: "Molecules/Metric",
  component: Metric,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      description: "Numeric or formatted value string",
      control: { type: "text" },
    },
    unit: {
      description: "Optional unit label shown baseline-aligned next to value",
      control: { type: "text" },
    },
    label: {
      description: "Small descriptor below the value",
      control: { type: "text" },
    },
    className: {
      description: "Additional CSS classes",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof Metric>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default stat with unit
 */
export const Default: Story = {
  args: {
    value: "320",
    unit: "W",
    label: "Avg Power",
  },
};

/**
 * Without unit
 */
export const NoUnit: Story = {
  args: {
    value: "42",
    label: "Laps",
  },
};

/**
 * Row of metrics
 */
export const MetricRow: Story = {
  render: () => (
    <div className="flex gap-6 bg-surface p-4 rounded-lg">
      <Metric value="1h 12m" label="Duration" />
      <Metric value="320" unit="W" label="Avg Power" />
      <Metric value="168" unit="bpm" label="Avg HR" />
      <Metric value="92" unit="rpm" label="Cadence" />
    </div>
  ),
};
