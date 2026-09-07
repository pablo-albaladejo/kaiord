import type { Meta, StoryObj } from "@storybook/react";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { ExecutedActivityDialog } from "./ExecutedActivityDialog";

const now = new Date().toISOString();

function makeWorkout(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: "activity-1",
    profileId: "p1",
    date: "2026-04-06",
    sport: "running",
    source: "garmin-bridge",
    sourceId: "ext-1",
    planId: null,
    state: "structured",
    raw: {
      title: "running",
      description: "",
      comments: [],
      distance: { value: 5000, unit: "m" },
      duration: { value: 1800, unit: "s" },
      prescribedRpe: null,
      rawHash: "hash-1",
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
  title: "Molecules/ExecutedActivityDialog",
  component: ExecutedActivityDialog,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof ExecutedActivityDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A recorded 30-minute run with distance and duration.
 */
export const RunningActivity: Story = {
  args: {
    workout: makeWorkout(),
    onClose: () => console.log("onClose"),
  },
};

/**
 * A long recorded ride — duration rolls over to the H:MM:SS format.
 */
export const CyclingLongRide: Story = {
  args: {
    workout: makeWorkout({
      sport: "cycling",
      raw: {
        title: "cycling",
        description: "",
        comments: [],
        distance: { value: 90000, unit: "m" },
        duration: { value: 12600, unit: "s" },
        prescribedRpe: null,
        rawHash: "hash-2",
      },
    }),
    onClose: () => console.log("onClose"),
  },
};

/**
 * An indoor session with no distance recorded — the distance chip is
 * omitted entirely rather than showing "0 m".
 */
export const NoDistanceRecorded: Story = {
  args: {
    workout: makeWorkout({
      sport: "strength_training",
      raw: {
        title: "strength_training",
        description: "",
        comments: [],
        distance: null,
        duration: { value: 2700, unit: "s" },
        prescribedRpe: null,
        rawHash: "hash-3",
      },
    }),
    onClose: () => console.log("onClose"),
  },
};

/**
 * `raw` itself is null (no source data was ever attached) — the dialog
 * falls back to the sport name for its heading and omits the metric
 * chips entirely.
 */
export const NoRawData: Story = {
  args: {
    workout: makeWorkout({
      sport: "swimming",
      raw: null,
    }),
    onClose: () => console.log("onClose"),
  },
};
