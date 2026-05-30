import type { Meta, StoryObj } from "@storybook/react";

import { SummaryStrip } from "./SummaryStrip";

const meta = {
  title: "Molecules/SummaryStrip",
  component: SummaryStrip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SummaryStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { icon: "clock", value: "1:02:00", label: "Duration" },
      { icon: "zap", value: "85", label: "TSS" },
      { icon: "flame", value: "High", label: "Load" },
    ],
  },
};

export const WithRouteAndHeart: Story = {
  args: {
    items: [
      { icon: "route", value: "42 km", label: "Distance" },
      { icon: "heart", value: "148", label: "Avg HR" },
      { icon: "target", value: "220 W", label: "Avg Power" },
    ],
  },
};
