import type { Meta, StoryObj } from "@storybook/react";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";
import type { KRD, RepetitionBlock, WorkoutStep } from "../../../types/krd";
import { ToastProvider } from "../../atoms/Toast";
import { ScratchEditorSurface } from "./ScratchEditorSurface";

/**
 * `ScratchEditorSurface` reads `useWorkoutStore` (a zustand module
 * singleton) directly, plus `usePersistence`/`useToastContext` via
 * `ScratchScheduleButton` -> `usePersistScratch`. Neither is part of the
 * global Storybook provider stack, so this file wraps the real
 * `PersistenceProvider` (backed by the real Dexie adapter) and the real
 * Toast providers around every story, and seeds the store with the real
 * `loadWorkout` setter before each render — never a mock.
 */
const meta = {
  title: "Organisms/ScratchEditorSurface",
  component: ScratchEditorSurface,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      // Reset to a known, unseeded state so every story starts clean.
      useWorkoutStore.setState({
        currentWorkout: null,
        undoHistory: [],
        historyIndex: -1,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
      });
      return (
        <PersistenceProvider persistence={createDexiePersistence(db)}>
          <ToastProvider>
            <ToastContextProvider>
              <Story />
            </ToastContextProvider>
          </ToastProvider>
        </PersistenceProvider>
      );
    },
  ],
} satisfies Meta<typeof ScratchEditorSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

const warmupStep: WorkoutStep = {
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: "power",
  target: { type: "power", value: { unit: "watts", value: 150 } },
  intensity: "warmup",
  name: "Warmup",
};

const intervalStep: WorkoutStep = {
  stepIndex: 1,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "power",
  target: { type: "power", value: { unit: "watts", value: 260 } },
  intensity: "active",
  name: "Threshold",
};

const recoveryStep: WorkoutStep = {
  stepIndex: 2,
  durationType: "time",
  duration: { type: "time", seconds: 120 },
  targetType: "power",
  target: { type: "power", value: { unit: "watts", value: 100 } },
  intensity: "rest",
  name: "Recovery",
};

const cooldownStep: WorkoutStep = {
  stepIndex: 3,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "open",
  target: { type: "open" },
  intensity: "cooldown",
  name: "Cooldown",
};

const cyclingWorkout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-06-01T08:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Sweet Spot Intervals",
      sport: "cycling",
      steps: [warmupStep, intervalStep, recoveryStep, cooldownStep],
    },
  },
};

const runWarmup: WorkoutStep = {
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: "pace",
  target: { type: "pace", value: { unit: "mps", value: 2.78 } },
  intensity: "warmup",
  name: "Warmup jog",
};

const runInterval: WorkoutStep = {
  stepIndex: 1,
  durationType: "distance",
  duration: { type: "distance", meters: 1000 },
  targetType: "pace",
  target: { type: "pace", value: { unit: "mps", value: 3.97 } },
  intensity: "active",
  name: "1km repeat",
};

const runRecovery: WorkoutStep = {
  stepIndex: 2,
  durationType: "time",
  duration: { type: "time", seconds: 180 },
  targetType: "pace",
  target: { type: "pace", value: { unit: "mps", value: 2.56 } },
  intensity: "rest",
  name: "Jog recovery",
};

const runCooldown: WorkoutStep = {
  stepIndex: 3,
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: "open",
  target: { type: "open" },
  intensity: "cooldown",
  name: "Cooldown jog",
};

const intervalRunningWorkout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-06-02T07:00:00Z", sport: "running" },
  extensions: {
    structured_workout: {
      name: "5x1km Threshold Repeats",
      sport: "running",
      steps: [
        runWarmup,
        {
          repeatCount: 5,
          steps: [runInterval, runRecovery],
        } as RepetitionBlock,
        runCooldown,
      ],
    },
  },
};

const swimWarmup: WorkoutStep = {
  stepIndex: 0,
  durationType: "distance",
  duration: { type: "distance", meters: 400 },
  targetType: "open",
  target: { type: "open" },
  intensity: "warmup",
  name: "Warmup swim",
};

const drillReps: Array<WorkoutStep> = Array.from({ length: 8 }, (_, i) => ({
  stepIndex: i + 1,
  durationType: "distance",
  duration: { type: "distance", meters: 50 },
  targetType: "open",
  target: { type: "open" },
  intensity: i % 2 === 0 ? "active" : "rest",
  name: i % 2 === 0 ? "50m drill" : "50m easy",
}));

const buildReps: Array<WorkoutStep> = Array.from({ length: 4 }, (_, i) => ({
  stepIndex: i + 9,
  durationType: "distance",
  duration: { type: "distance", meters: 100 },
  targetType: "open",
  target: { type: "open" },
  intensity: "active",
  name: "100m build",
}));

const swimCooldown: WorkoutStep = {
  stepIndex: 13,
  durationType: "distance",
  duration: { type: "distance", meters: 200 },
  targetType: "open",
  target: { type: "open" },
  intensity: "cooldown",
  name: "Cooldown swim",
};

const longSwimmingWorkout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: "2026-06-03T06:30:00Z",
    sport: "swimming",
    subSport: "lap_swimming",
  },
  extensions: {
    structured_workout: {
      name: "Aerobic Base Swim Set",
      sport: "swimming",
      subSport: "lap_swimming",
      steps: [swimWarmup, ...drillReps, ...buildReps, swimCooldown],
    },
  },
};

/**
 * No workout is seeded: this is the real first-load behaviour of
 * `/workout/new?source=scratch` — `useScratchAutoSeed` sees `currentWorkout
 * === null` and creates an empty cycling workout with the metadata editor
 * pre-opened, exactly as a brand-new scratch session does in production.
 */
export const EmptyNewScratchWorkout: Story = {
  args: {
    date: null,
  },
};

export const SimpleCyclingWorkout: Story = {
  args: {
    date: "2026-06-10",
  },
  decorators: [
    (Story) => {
      useWorkoutStore.getState().loadWorkout(cyclingWorkout);
      return <Story />;
    },
  ],
};

export const IntervalWorkoutWithRepetitionBlock: Story = {
  args: {
    date: "2026-06-12",
  },
  decorators: [
    (Story) => {
      useWorkoutStore.getState().loadWorkout(intervalRunningWorkout);
      return <Story />;
    },
  ],
};

export const LongSwimmingWorkout: Story = {
  args: {
    date: null,
  },
  decorators: [
    (Story) => {
      useWorkoutStore.getState().loadWorkout(longSwimmingWorkout);
      return <Story />;
    },
  ],
};
