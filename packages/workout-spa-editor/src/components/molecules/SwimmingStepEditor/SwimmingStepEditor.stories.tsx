import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { SwimmingStepEditor } from "./SwimmingStepEditor";

const meta = {
  title: "Molecules/SwimmingStepEditor",
  component: SwimmingStepEditor,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    onStrokeTypeChange: fn(),
    onEquipmentChange: fn(),
  },
} satisfies Meta<typeof SwimmingStepEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FreestyleNoEquipment: Story = {
  args: {
    strokeType: "freestyle",
    equipment: "none",
  },
};

export const ButterflyWithPaddles: Story = {
  args: {
    strokeType: "butterfly",
    equipment: "swim_paddles",
  },
};

export const DrillWithKickboard: Story = {
  args: {
    strokeType: "drill",
    equipment: "swim_kickboard",
  },
};

export const IndividualMedleyWithSnorkel: Story = {
  args: {
    strokeType: "im",
    equipment: "swim_snorkel",
  },
};
