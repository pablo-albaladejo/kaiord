import type { Meta, StoryObj } from "@storybook/react";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { RawWorkoutDialog } from "./RawWorkoutDialog";

const now = new Date().toISOString();

function makeWorkout(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: "w-1",
    profileId: "p1",
    date: "2026-03-15",
    sport: "Running",
    source: "garmin",
    sourceId: null,
    planId: null,
    state: "raw",
    raw: {
      title: "Easy Run",
      description: "Coach says: take it easy today.",
      comments: [
        {
          author: "Coach",
          text: "Morning prep note",
          timestamp: "2026-03-15T08:00:00Z",
        },
        {
          author: "Athlete",
          text: "Afternoon feedback",
          timestamp: "2026-03-15T14:00:00Z",
        },
      ],
      distance: null,
      duration: null,
      prescribedRpe: null,
      rawHash: "abc123",
    },
    krd: null,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: now,
    modifiedAt: null,
    updatedAt: now,
    ...overrides,
  };
}

const meta = {
  title: "Molecules/RawWorkoutDialog",
  component: RawWorkoutDialog,
  parameters: {
    layout: "fullscreen",
    route: "/calendar",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RawWorkoutDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A freshly-imported raw workout with a coach description and two
 * comments (the morning one pre-selected).
 */
export const Default: Story = {
  args: {
    workout: makeWorkout(),
    onClose: () => console.log("onClose"),
    onProcess: (id, indices) => console.log("onProcess", id, indices),
    onSkip: (id) => console.log("onSkip", id),
    onUnskip: (id) => console.log("onUnskip", id),
  },
};

/**
 * No coach comments were attached to the import.
 */
export const NoComments: Story = {
  args: {
    workout: makeWorkout({
      raw: {
        title: "Easy Run",
        description: "",
        comments: [],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "abc",
      },
    }),
    onClose: () => console.log("onClose"),
    onProcess: (id, indices) => console.log("onProcess", id, indices),
    onSkip: (id) => console.log("onSkip", id),
    onUnskip: (id) => console.log("onUnskip", id),
  },
};

/**
 * A previously-skipped workout swaps "Process with AI" / "Skip" for a
 * single "Un-skip" action.
 */
export const Skipped: Story = {
  args: {
    workout: makeWorkout({ state: "skipped" }),
    onClose: () => console.log("onClose"),
    onProcess: (id, indices) => console.log("onProcess", id, indices),
    onSkip: (id) => console.log("onSkip", id),
    onUnskip: (id) => console.log("onUnskip", id),
  },
};

/**
 * A process/skip request is in flight — every action button is
 * disabled until it resolves.
 */
export const Submitting: Story = {
  args: {
    workout: makeWorkout(),
    isSubmitting: true,
    onClose: () => console.log("onClose"),
    onProcess: (id, indices) => console.log("onProcess", id, indices),
    onSkip: (id) => console.log("onSkip", id),
    onUnskip: (id) => console.log("onUnskip", id),
  },
};

/**
 * A long coach description plus a busy comment thread.
 */
export const ManyComments: Story = {
  args: {
    workout: makeWorkout({
      raw: {
        title: "Threshold Intervals",
        description:
          "Coach says: this is the key session of the week — 5x8min at threshold with 3min easy recovery between reps. Focus on holding a consistent pace through the last two intervals; if you fade badly on rep 4 or 5, back the target pace off by 3-5 seconds per km rather than blowing up completely. Fuel with a gel before rep 3.",
        comments: [
          {
            author: "Coach",
            text: "Warm up 15min easy before starting the intervals.",
            timestamp: "2026-03-15T07:00:00Z",
          },
          {
            author: "Coach",
            text: "If it's windy, do the reps on the sheltered loop.",
            timestamp: "2026-03-15T07:05:00Z",
          },
          {
            author: "Athlete",
            text: "Legs felt heavy on rep 4, backed off slightly.",
            timestamp: "2026-03-15T15:20:00Z",
          },
          {
            author: "Athlete",
            text: "Overall a solid session, HR stayed in range.",
            timestamp: "2026-03-15T15:22:00Z",
          },
          {
            author: "Coach",
            text: "Good adjustment — that's exactly the right call.",
            timestamp: "2026-03-15T18:00:00Z",
          },
          {
            author: "Coach",
            text: "Rest day tomorrow, then an easy 40min shakeout.",
            timestamp: "2026-03-15T18:02:00Z",
          },
        ],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "def456",
      },
    }),
    onClose: () => console.log("onClose"),
    onProcess: (id, indices) => console.log("onProcess", id, indices),
    onSkip: (id) => console.log("onSkip", id),
    onUnskip: (id) => console.log("onUnskip", id),
  },
};
