import type { Meta, StoryObj } from "@storybook/react";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { PushButton } from "./PushButton";

const SAMPLE_WORKOUT = { id: "demo", krd: {} } as unknown as WorkoutRecord;

const meta = {
  title: "Molecules/PushButton",
  component: PushButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    workout: SAMPLE_WORKOUT,
  },
} satisfies Meta<typeof PushButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Idle state — the default interactive "Push to Garmin" button. */
export const Idle: Story = {};

/** Full-width idle variant for sticky footers. */
export const FullWidth: Story = {
  args: {
    full: true,
  },
};

/** Large size variant. */
export const Large: Story = {
  args: {
    size: "lg",
  },
};
