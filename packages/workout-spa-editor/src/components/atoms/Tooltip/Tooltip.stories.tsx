import type { Meta, StoryObj } from "@storybook/react";

import { Tooltip } from "./Tooltip";

const meta = {
  title: "Atoms/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = {
  args: {
    content: "Delete step",
    side: "top",
    children: <button type="button">Hover me</button>,
  },
};

export const RightAligned: Story = {
  args: {
    content: "Duplicate step",
    side: "right",
    children: <button type="button">Hover me</button>,
  },
};

export const BottomStart: Story = {
  args: {
    content: "Move to the next block",
    side: "bottom",
    align: "start",
    children: <button type="button">Hover me</button>,
  },
};

export const LeftEnd: Story = {
  args: {
    content: "Collapse the step list",
    side: "left",
    align: "end",
    children: <button type="button">Hover me</button>,
  },
};

export const Disabled: Story = {
  args: {
    content: "This never shows",
    disabled: true,
    children: <button type="button">Hover me</button>,
  },
};
