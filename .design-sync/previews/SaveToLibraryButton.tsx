import type { KRD } from "@ds-stories/packages/workout-spa-editor/src/types/krd";
import { SaveToLibraryButton } from "@ds-stories/packages/workout-spa-editor/src/components/molecules/SaveToLibraryButton/SaveToLibraryButton";

/**
 * `SaveToLibraryButton` takes no context/store dependency — the only trap
 * here is the prop name and shape (`workout: KRD`, not a `WorkoutRecord`
 * or a bare `Workout`). Fixtures below mirror
 * `SaveToLibraryButton.stories.tsx` exactly.
 */
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

export const Idle = () => <SaveToLibraryButton workout={workout} />;

export const EmptyWorkout = () => (
  <SaveToLibraryButton workout={emptyWorkout} />
);

export const Disabled = () => (
  <SaveToLibraryButton workout={workout} disabled />
);
