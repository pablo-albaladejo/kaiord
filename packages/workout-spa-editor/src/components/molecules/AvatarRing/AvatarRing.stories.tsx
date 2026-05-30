import type { Meta, StoryObj } from "@storybook/react";

import { AvatarRing } from "./AvatarRing";

const meta = {
  title: "Molecules/AvatarRing",
  component: AvatarRing,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    initials: {
      description: "Initials displayed inside the ring",
      control: { type: "text" },
    },
    size: {
      description: "Diameter in pixels",
      control: { type: "number" },
    },
    className: {
      description: "Additional CSS classes",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof AvatarRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initials: "JD",
  },
};

export const Large: Story = {
  args: {
    initials: "AB",
    size: 96,
  },
};

export const Small: Story = {
  args: {
    initials: "XY",
    size: 48,
  },
};
