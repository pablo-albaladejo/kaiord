import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { useWorkoutStore } from "../../../store/workout-store";
import type { KRD, WorkoutStep } from "../../../types/krd";
import { CommandPalette } from "./CommandPalette";

const demoStep = (stepIndex: number): WorkoutStep => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "power",
  target: { type: "power", value: { unit: "watts", value: 200 } },
  intensity: "active",
});

const DEMO_WORKOUT: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Sweet Spot Intervals",
      sport: "cycling",
      steps: [demoStep(0), demoStep(1)],
    },
  },
};

const resetWorkoutStore = () =>
  useWorkoutStore.setState({
    currentWorkout: null,
    undoHistory: [],
    historyIndex: -1,
    selectedStepId: null,
    selectedStepIds: [],
  });

/**
 * `useEditorCommands` reads live off the `useWorkoutStore` zustand
 * singleton — each story seeds it directly via `setState` (the store's
 * own setter API) before rendering, rather than mocking the hook.
 */
const meta = {
  title: "Organisms/CommandPalette",
  component: CommandPalette,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The ⌘K palette: one entry point for both 'do it' (editor commands, guarded by real selection/history state) and 'learn' (documentation links). It replaced a separate Help button.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      resetWorkoutStore();
      return <Story />;
    },
  ],
  args: {
    open: true,
    onOpenChange: fn(),
    onShowShortcuts: fn(),
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Brand-new editor, nothing open yet — every "Do it" row is disabled and explains why. */
export const EmptyEditor: Story = {};

/** A workout is open but nothing has changed yet — Save and Select all light up. */
export const UnsavedDraft: Story = {
  decorators: [
    (Story) => {
      useWorkoutStore.setState({ currentWorkout: DEMO_WORKOUT });
      return <Story />;
    },
  ],
};

/** Mid-edit with history and a two-step selection — Save, Undo and Group are all enabled. */
export const ActiveEditingSession: Story = {
  decorators: [
    (Story) => {
      useWorkoutStore.setState({
        currentWorkout: DEMO_WORKOUT,
        undoHistory: [
          { workout: DEMO_WORKOUT, selection: null },
          { workout: DEMO_WORKOUT, selection: null },
        ],
        historyIndex: 1,
        selectedStepIds: ["step-0", "step-1"],
      });
      return <Story />;
    },
  ],
};
