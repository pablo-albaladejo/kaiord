import type { Meta, StoryObj } from "@storybook/react";

import { EmptyWorkoutState } from "./EmptyWorkoutState";

const meta = {
  title: "Molecules/EmptyWorkoutState",
  component: EmptyWorkoutState,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyWorkoutState>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The component's only visual state — a new, stepless workout. There is no
 * error, loading or partial variant to show: it either has zero steps (this)
 * or it has at least one, at which point the step list renders instead.
 */
export const Default: Story = {
  args: { onAddStep: () => {} },
};
