import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import type { WorkoutStep } from "../../../types/krd";
import { StepEditor } from "./StepEditor";

const meta = {
  title: "Organisms/StepEditor",
  component: StepEditor,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    step: {
      description: "The workout step to edit",
      control: { type: "object" },
    },
    onSave: {
      description: "Callback when user saves changes",
      action: "saved",
    },
    onCancel: {
      description: "Callback when user cancels editing",
      action: "cancelled",
    },
  },
  args: {
    onSave: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof StepEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const timeStep: WorkoutStep = {
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "power",
  target: {
    type: "power",
    value: { unit: "watts", value: 200 },
  },
  intensity: "warmup",
};

const distanceStep: WorkoutStep = {
  stepIndex: 1,
  durationType: "distance",
  duration: { type: "distance", meters: 5000 },
  targetType: "heart_rate",
  target: {
    type: "heart_rate",
    value: { unit: "bpm", value: 150 },
  },
  intensity: "active",
};

const openStep: WorkoutStep = {
  stepIndex: 2,
  durationType: "open",
  duration: { type: "open" },
  targetType: "open",
  target: { type: "open" },
  intensity: "cooldown",
};

const powerZoneStep: WorkoutStep = {
  stepIndex: 3,
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: "power",
  target: {
    type: "power",
    value: { unit: "zone", value: 4 },
  },
  intensity: "active",
};

const paceStep: WorkoutStep = {
  stepIndex: 4,
  durationType: "distance",
  duration: { type: "distance", meters: 10000 },
  targetType: "pace",
  target: {
    type: "pace",
    value: { unit: "min_per_km", value: 5.5 },
  },
  intensity: "active",
};

export const TimeWithPower: Story = {
  args: {
    step: timeStep,
  },
};

export const DistanceWithHeartRate: Story = {
  args: {
    step: distanceStep,
  },
};

export const OpenDurationAndTarget: Story = {
  args: {
    step: openStep,
  },
};

export const PowerZoneTarget: Story = {
  args: {
    step: powerZoneStep,
  },
};

export const PaceTarget: Story = {
  args: {
    step: paceStep,
  },
};

export const NoStep: Story = {
  args: {
    step: null,
  },
};
