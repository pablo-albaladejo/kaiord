import type { Meta, StoryObj } from "@storybook/react";
import type { RepetitionBlock, WorkoutStep } from "../../../types/krd";
import { WorkoutList } from "./WorkoutList";

const meta = {
  title: "Organisms/WorkoutList",
  component: WorkoutList,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof WorkoutList>;

export default meta;
type Story = StoryObj<typeof meta>;

const createStep = (
  stepIndex: number,
  overrides?: Partial<WorkoutStep>
): WorkoutStep => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "power",
  target: {
    type: "power",
    value: { unit: "watts", value: 200 },
  },
  intensity: "active",
  ...overrides,
});

const warmupStep = createStep(0, {
  intensity: "warmup",
  duration: { type: "time", seconds: 600 },
  name: "Warmup",
});

const intervalStep = createStep(1, {
  intensity: "active",
  duration: { type: "time", seconds: 300 },
  name: "Hard Interval",
});

const recoveryStep = createStep(2, {
  intensity: "rest",
  duration: { type: "time", seconds: 180 },
  name: "Recovery",
});

const cooldownStep = createStep(3, {
  intensity: "cooldown",
  duration: { type: "time", seconds: 600 },
  name: "Cooldown",
});

export const SimpleWorkout: Story = {
  args: {
    structured_workout: {
      name: "Simple Workout",
      sport: "cycling",
      steps: [warmupStep, intervalStep, cooldownStep],
    },
  },
};

export const WithRepetitionBlock: Story = {
  args: {
    structured_workout: {
      name: "Interval Workout",
      sport: "cycling",
      steps: [
        warmupStep,
        {
          repeatCount: 4,
          steps: [intervalStep, recoveryStep],
        } as RepetitionBlock,
        cooldownStep,
      ],
    },
  },
};

export const WithSelectedStep: Story = {
  args: {
    structured_workout: {
      name: "Workout with Selection",
      sport: "cycling",
      steps: [warmupStep, intervalStep, recoveryStep, cooldownStep],
    },
    selectedStepId: "step-1",
  },
};

export const EmptyWorkout: Story = {
  args: {
    structured_workout: {
      name: "Empty Workout",
      sport: "cycling",
      steps: [],
    },
  },
};
