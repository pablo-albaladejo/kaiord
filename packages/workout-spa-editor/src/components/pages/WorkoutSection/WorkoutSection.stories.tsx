import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../../types/krd";
import { WorkoutSection } from "./WorkoutSection";

const meta = {
  title: "Pages/WorkoutSection",
  component: WorkoutSection,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof WorkoutSection>;

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

// `WorkoutSection` reads `krd.extensions.structured_workout` in the real
// app (that key, not `workout`, holds the actual data — the trap this
// design-system pass is guarding against), and `workout` is that same
// object passed alongside it. Mirrors the shape `WorkoutSection.focus-
// integration.test.tsx` builds its fixtures with.
function buildKrd(workout: Workout): KRD {
  return {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-01T00:00:00Z", sport: workout.sport },
    extensions: { structured_workout: workout },
  } as unknown as KRD;
}

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
  args: {
    workout: simpleWorkout,
    krd: buildKrd(simpleWorkout),
    selectedStepId: null,
    onStepSelect: fn(),
  },
};

export const WithRepetitionBlock: Story = {
  args: {
    workout: intervalWorkout,
    krd: buildKrd(intervalWorkout),
    selectedStepId: null,
    onStepSelect: fn(),
  },
};

export const StepSelected: Story = {
  args: {
    workout: intervalWorkout,
    krd: buildKrd(intervalWorkout),
    selectedStepId: "step-3",
    onStepSelect: fn(),
  },
};

/** A freshly created workout before its first step is added. */
export const EmptyWorkout: Story = {
  args: {
    workout: emptyWorkout,
    krd: buildKrd(emptyWorkout),
    selectedStepId: null,
    onStepSelect: fn(),
  },
};
