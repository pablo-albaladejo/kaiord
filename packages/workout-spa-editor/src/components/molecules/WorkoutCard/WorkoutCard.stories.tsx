import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import type { WorkoutRecord } from "../../../types/calendar-record";
import type { KRD, Workout } from "../../../types/krd";
import { WorkoutCard } from "./WorkoutCard";

/**
 * Same shape as `structuredKrd` in `test-utils/zone-profile-fixtures`,
 * rebuilt locally so this story stays self-contained. Percentages are read
 * against the power model bounds (0.55 / 0.75 / 0.90 / 1.05): 50% is Z1,
 * 65% Z2, 82% Z3, 98% Z4, 115% Z5.
 */
type ZoneStep = { percentFtp: number; seconds: number };

function structuredKrd(steps: ZoneStep[]): KRD {
  const workout: Workout = {
    name: "Fixture",
    sport: "cycling",
    steps: steps.map((step, index) => ({
      stepIndex: index,
      durationType: "time",
      duration: { type: "time", seconds: step.seconds },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "percent_ftp", value: step.percentFtp },
      },
    })),
  };
  return {
    version: "1.0.0",
    type: "workout",
    metadata: { source: "fixture" },
    extensions: { structured_workout: workout },
  } as unknown as KRD;
}

/** Warm-up, two threshold blocks with a recovery between, cool-down — Z4 dominant. */
const THRESHOLD_STEPS: ZoneStep[] = [
  { percentFtp: 65, seconds: 300 },
  { percentFtp: 98, seconds: 900 },
  { percentFtp: 50, seconds: 300 },
  { percentFtp: 98, seconds: 900 },
  { percentFtp: 65, seconds: 300 },
];

/** One flat endurance block — Z2 dominant, single segment. */
const ENDURANCE_STEPS: ZoneStep[] = [{ percentFtp: 65, seconds: 3600 }];

function makeWorkout(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: "w1",
    profileId: "profile-1",
    date: "2026-04-06",
    sport: "running",
    source: "kaiord",
    sourceId: null,
    planId: null,
    state: "raw",
    raw: {
      title: "Easy run",
      description: "30 min easy",
      comments: [],
      distance: null,
      duration: { value: 1800, unit: "s" },
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
    createdAt: "2026-04-06T08:00:00.000Z",
    modifiedAt: null,
    updatedAt: "2026-04-06T08:00:00.000Z",
    ...overrides,
  };
}

const meta = {
  title: "Molecules/WorkoutCard",
  component: WorkoutCard,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof WorkoutCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A raw import has no classifiable structure yet, so it keeps the neutral edge. */
export const RawImport: Story = {
  args: { workout: makeWorkout(), onClick: fn() },
};

/** Structured and Z2 dominant — the lateral border takes the endurance zone colour. */
export const ReadyEndurance: Story = {
  args: {
    workout: makeWorkout({
      id: "w2",
      sport: "cycling",
      source: "train2go",
      state: "ready",
      raw: {
        title: "Zone 2 endurance ride",
        description: "60 min steady",
        comments: [],
        distance: null,
        duration: { value: 3600, unit: "s" },
        prescribedRpe: null,
        rawHash: "def456",
      },
      krd: structuredKrd(ENDURANCE_STEPS),
    }),
    onClick: fn(),
  },
};

/** Z4 dominant, pushed to a watch and AI-generated — shows two lifecycle badges and the list-view bar height. */
export const PushedThreshold: Story = {
  args: {
    workout: makeWorkout({
      id: "w3",
      sport: "cycling",
      source: "ai-generated",
      state: "pushed",
      garminPushId: "garmin-activity-789",
      raw: {
        title: "Threshold 2 × 15",
        description: "2 x 15 min at threshold",
        comments: [],
        distance: null,
        duration: { value: 2700, unit: "s" },
        prescribedRpe: null,
        rawHash: "ghi789",
      },
      krd: structuredKrd(THRESHOLD_STEPS),
    }),
    view: "list",
    onClick: fn(),
  },
};

/** A stale session needs the user's attention, said as a word — never a colour. */
export const StaleNeedsAttention: Story = {
  args: {
    workout: makeWorkout({
      id: "w4",
      sport: "running",
      source: "kaiord",
      state: "stale",
    }),
    onClick: fn(),
  },
};
