import type { Meta, StoryObj } from "@storybook/react";
import type { Workout } from "../../../types/krd";
import { WorkoutStats } from "./WorkoutStats";

const meta = {
  title: "Organisms/WorkoutStats",
  component: WorkoutStats,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    structured_workout: {
      description: "Workout object to display statistics for",
      control: { type: "object" },
    },
    className: {
      description: "Additional CSS classes",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof WorkoutStats>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample workout with time-based steps
const timeBasedWorkout: Workout = {
  name: "Morning Run",
  sport: "running",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "open",
      target: { type: "open" },
      intensity: "warmup",
    },
    {
      stepIndex: 1,
      durationType: "time",
      duration: { type: "time", seconds: 1200 },
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      },
      intensity: "active",
    },
    {
      stepIndex: 2,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "open",
      target: { type: "open" },
      intensity: "cooldown",
    },
  ],
};

// Sample workout with distance-based steps
const distanceBasedWorkout: Workout = {
  name: "5K Run",
  sport: "running",
  steps: [
    {
      stepIndex: 0,
      durationType: "distance",
      duration: { type: "distance", meters: 1000 },
      targetType: "open",
      target: { type: "open" },
      intensity: "warmup",
    },
    {
      stepIndex: 1,
      durationType: "distance",
      duration: { type: "distance", meters: 3000 },
      targetType: "pace",
      target: {
        type: "pace",
        value: { unit: "min_per_km", value: 5 },
      },
      intensity: "active",
    },
    {
      stepIndex: 2,
      durationType: "distance",
      duration: { type: "distance", meters: 1000 },
      targetType: "open",
      target: { type: "open" },
      intensity: "cooldown",
    },
  ],
};

// Sample workout with mixed duration types
const mixedWorkout: Workout = {
  name: "Interval Training",
  sport: "cycling",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 600 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "zone", value: 2 },
      },
      intensity: "warmup",
    },
    {
      stepIndex: 1,
      durationType: "distance",
      duration: { type: "distance", meters: 5000 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "zone", value: 4 },
      },
      intensity: "active",
    },
    {
      stepIndex: 2,
      durationType: "open",
      duration: { type: "open" },
      targetType: "open",
      target: { type: "open" },
      intensity: "cooldown",
    },
  ],
};

// Sample workout with single step
const singleStepWorkout: Workout = {
  name: "Easy Ride",
  sport: "cycling",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 3600 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "zone", value: 2 },
      },
      intensity: "active",
    },
  ],
};

// Sample workout with many steps
const complexWorkout: Workout = {
  name: "Complex Interval Workout",
  sport: "running",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 600 },
      targetType: "open",
      target: { type: "open" },
      intensity: "warmup",
    },
    {
      stepIndex: 1,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: { unit: "zone", value: 4 },
      },
      intensity: "active",
    },
    {
      stepIndex: 2,
      durationType: "time",
      duration: { type: "time", seconds: 120 },
      targetType: "open",
      target: { type: "open" },
      intensity: "rest",
    },
    {
      stepIndex: 3,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: { unit: "zone", value: 4 },
      },
      intensity: "active",
    },
    {
      stepIndex: 4,
      durationType: "time",
      duration: { type: "time", seconds: 120 },
      targetType: "open",
      target: { type: "open" },
      intensity: "rest",
    },
    {
      stepIndex: 5,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: { unit: "zone", value: 4 },
      },
      intensity: "active",
    },
    {
      stepIndex: 6,
      durationType: "time",
      duration: { type: "time", seconds: 600 },
      targetType: "open",
      target: { type: "open" },
      intensity: "cooldown",
    },
  ],
};

/**
 * Default stats with time-based workout
 */
export const Default: Story = {
  args: {
    structured_workout: timeBasedWorkout,
  },
};

/**
 * Stats with distance-based workout
 */
export const DistanceBased: Story = {
  args: {
    structured_workout: distanceBasedWorkout,
  },
};

/**
 * Stats with mixed duration types
 */
export const MixedDurations: Story = {
  args: {
    structured_workout: mixedWorkout,
  },
};

/**
 * Stats with single step workout
 */
export const SingleStep: Story = {
  args: {
    structured_workout: singleStepWorkout,
  },
};

/**
 * Stats with complex multi-step workout
 */
export const ComplexWorkout: Story = {
  args: {
    structured_workout: complexWorkout,
  },
};

/**
 * No workout (null state)
 */
export const NoWorkout: Story = {
  args: {
    structured_workout: null,
  },
};

/**
 * Stats with custom styling
 */
export const CustomStyling: Story = {
  args: {
    structured_workout: timeBasedWorkout,
    className: "max-w-md",
  },
};
