import type { ReactNode } from "react";
import { PersistenceProvider } from "../../packages/workout-spa-editor/src/contexts/persistence-context";
import type { KRD } from "../../packages/workout-spa-editor/src/types/krd";
import { SaveToLibraryButton } from "../../packages/workout-spa-editor/src/components/molecules/SaveToLibraryButton/SaveToLibraryButton";
import { createInMemoryPersistence } from "../../packages/workout-spa-editor/src/test-utils/in-memory-persistence";

/**
 * Two traps here. The prop is `workout: KRD` — not a `WorkoutRecord`, not a
 * bare `Workout`. And the always-mounted `SaveToLibraryDialog` calls
 * `useSaveToLibrary()` -> `usePersistence()` unconditionally, even closed, so
 * without a provider the card throws instead of rendering. The global chain
 * omits persistence on purpose (the real port opens Dexie and blanks every
 * card), so an in-memory one is wrapped here. Fixtures mirror
 * `SaveToLibraryButton.stories.tsx`.
 */
const persistence = createInMemoryPersistence();

const withPersistence = (node: ReactNode) => (
  <PersistenceProvider persistence={persistence}>{node}</PersistenceProvider>
);
const workout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: "2026-05-01T08:00:00Z",
    sport: "cycling",
  },
  extensions: {
    structured_workout: {
      name: "Sweet Spot Intervals",
      sport: "cycling",
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
          duration: { type: "time", seconds: 1200 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "percent_ftp", value: 92 },
          },
          intensity: "active",
        },
      ],
    },
  },
};

const emptyWorkout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: "2026-05-01T08:00:00Z",
    sport: "cycling",
  },
  extensions: {
    structured_workout: {
      name: "Untitled workout",
      sport: "cycling",
      steps: [],
    },
  },
};

export const Idle = () =>
  withPersistence(<SaveToLibraryButton workout={workout} />);

export const EmptyWorkout = () =>
  withPersistence(<SaveToLibraryButton workout={emptyWorkout} />);

export const Disabled = () =>
  withPersistence(<SaveToLibraryButton workout={workout} disabled />);
