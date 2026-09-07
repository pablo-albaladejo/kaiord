import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { WorkoutPreview } from "./WorkoutPreview";

const meta = {
  title: "Molecules/WorkoutPreview",
  component: WorkoutPreview,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof WorkoutPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

const step = (
  stepIndex: number,
  overrides: Partial<WorkoutStep> = {}
): WorkoutStep => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "power",
  target: { type: "power", value: { unit: "watts", value: 200 } },
  intensity: "active",
  ...overrides,
});

const warmup = step(0, {
  intensity: "warmup",
  duration: { type: "time", seconds: 600 },
  name: "Warmup",
});
const interval = step(1, {
  intensity: "active",
  duration: { type: "time", seconds: 300 },
  target: { type: "power", value: { unit: "watts", value: 260 } },
  name: "Threshold Interval",
});
const recovery = step(2, {
  intensity: "rest",
  duration: { type: "time", seconds: 180 },
  target: { type: "power", value: { unit: "watts", value: 100 } },
  name: "Recovery",
});
const cooldown = step(3, {
  intensity: "cooldown",
  duration: { type: "time", seconds: 600 },
  target: { type: "power", value: { unit: "watts", value: 120 } },
  name: "Cooldown",
});

const simpleWorkout: Workout = {
  name: "Easy Spin",
  sport: "cycling",
  steps: [
    warmup,
    step(1, {
      name: "Steady",
      duration: { type: "time", seconds: 1800 },
      target: { type: "power", value: { unit: "watts", value: 180 } },
    }),
    cooldown,
  ],
};

const intervalWorkout: Workout = {
  name: "Threshold 4x5",
  sport: "cycling",
  steps: [
    warmup,
    { repeatCount: 4, steps: [interval, recovery] } as RepetitionBlock,
    cooldown,
  ],
};

const emptyWorkout: Workout = {
  name: "New Workout",
  sport: "cycling",
  steps: [],
};

export const SimpleWorkout: Story = {
  args: { workout: simpleWorkout },
};

export const WithRepetitionBlock: Story = {
  args: { workout: intervalWorkout },
};

export const WithSelectedStep: Story = {
  args: {
    workout: intervalWorkout,
    selectedStepId: "step-3",
    onStepSelect: fn(),
  },
};

/** The component renders nothing when a workout has no steps to bar-chart —
 *  a real, honest contract worth showing rather than skipping. */
export const EmptyWorkout: Story = {
  args: { workout: emptyWorkout },
};
