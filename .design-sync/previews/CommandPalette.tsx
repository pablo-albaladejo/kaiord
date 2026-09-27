import { useState } from "react";

import { CommandPalette } from "../../packages/workout-spa-editor/src/components/organisms/CommandPalette/CommandPalette";
import type { useWorkoutStore as UseWorkoutStore } from "../../packages/workout-spa-editor/src/store/workout-store";
import type {
  KRD,
  WorkoutStep,
} from "../../packages/workout-spa-editor/src/types/krd";

/**
 * The store must be the bundle's own singleton: a source import compiles a
 * second zustand copy the palette never reads, so read it off the global.
 *
 * The palette's rows read live off the `useWorkoutStore` singleton, and the
 * stories seed it from story-level decorators the card harness never runs.
 * Every export therefore seeds the store itself, from the same empty base
 * the meta decorator resets to, so one export can never leak into another.
 */
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

type WorkoutStore = typeof UseWorkoutStore;
type EditorSeed = Partial<ReturnType<WorkoutStore["getState"]>>;

const useWorkoutStore = (
  window as unknown as { KaiordDesignSystem: { useWorkoutStore: WorkoutStore } }
).KaiordDesignSystem.useWorkoutStore;

const EMPTY_EDITOR: EditorSeed = {
  currentWorkout: null,
  undoHistory: [],
  historyIndex: -1,
  selectedStepId: null,
  selectedStepIds: [],
};

const noop = () => {};

/** Seeds once, before the first render of the palette below it. */
function SeededPalette({ seed }: { seed: EditorSeed }) {
  useState(() => {
    useWorkoutStore.setState({ ...EMPTY_EDITOR, ...seed });
  });
  return <CommandPalette open onOpenChange={noop} onShowShortcuts={noop} />;
}

/** Brand-new editor, nothing open yet — every "Do it" row is disabled. */
export const EmptyEditor = () => <SeededPalette seed={{}} />;

/** A workout is open but nothing has changed yet — Save and Select all light up. */
export const UnsavedDraft = () => (
  <SeededPalette seed={{ currentWorkout: DEMO_WORKOUT }} />
);

/** Mid-edit with history and a two-step selection. */
export const ActiveEditingSession = () => (
  <SeededPalette
    seed={{
      currentWorkout: DEMO_WORKOUT,
      undoHistory: [
        { workout: DEMO_WORKOUT, selection: null },
        { workout: DEMO_WORKOUT, selection: null },
      ],
      historyIndex: 1,
      selectedStepIds: ["step-0", "step-1"],
    }}
  />
);
