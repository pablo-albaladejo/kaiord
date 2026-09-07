import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import type { MatchSuggestion } from "../../../application/match-suggestion";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { AutoMatchBanner } from "./AutoMatchBanner";

const sug = (overrides: Partial<MatchSuggestion> = {}): MatchSuggestion => ({
  activityId: "p1:train2go:1",
  workoutId: "w-1",
  score: 0.92,
  reasons: [{ code: "sport-family-match", family: "cycling" }],
  ...overrides,
});

const ACTIVITIES: Record<string, CoachingActivity> = {
  "p1:train2go:1": {
    id: "p1:train2go:1",
    source: "train2go",
    sourceBadge: "T2G",
    date: "2026-04-29",
    sport: { label: "Cycling", icon: "\u{1F6B4}" },
    title: "FTP test",
    duration: "60 min",
    effort: 4,
    status: "completed",
  },
  "p1:train2go:2": {
    id: "p1:train2go:2",
    source: "train2go",
    sourceBadge: "T2G",
    date: "2026-04-30",
    sport: { label: "Running", icon: "\u{1F3C3}" },
    title: "Easy recovery run",
    duration: "35 min",
    effort: 2,
    status: "completed",
  },
  "p1:train2go:3": {
    id: "p1:train2go:3",
    source: "train2go",
    sourceBadge: "T2G",
    date: "2026-05-01",
    sport: { label: "Swimming", icon: "\u{1F3CA}" },
    title: "Technique drills",
    duration: "50 min",
    effort: 3,
    status: "completed",
  },
};

const WORKOUT_TITLES: Record<string, string> = {
  "w-1": "FTP test executed",
  "w-2": "Morning run",
  "w-3": "Pool session",
};

const resolveActivity = (id: string) => ACTIVITIES[id];
const resolveWorkoutTitle = (id: string) => WORKOUT_TITLES[id];

const meta = {
  title: "Organisms/AutoMatchBanner",
  component: AutoMatchBanner,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof AutoMatchBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two suggestions, both visible — no overflow, friendly labels resolved. */
export const TwoHighConfidenceMatches: Story = {
  args: {
    suggestions: [
      sug({ activityId: "p1:train2go:1", workoutId: "w-1", score: 0.92 }),
      sug({
        activityId: "p1:train2go:2",
        workoutId: "w-2",
        score: 0.85,
        reasons: [
          { code: "duration-match", deltaSeconds: 60 },
          { code: "sport-family-match", family: "running" },
        ],
      }),
    ],
    onAccept: fn(),
    onReject: fn(),
    resolveActivity,
    resolveWorkoutTitle,
  },
};

/** More than the 2-row cap: collapsed by default, "view all" expands the rest. */
export const OverflowWithFiveSuggestions: Story = {
  args: {
    suggestions: [
      sug({ activityId: "p1:train2go:1", workoutId: "w-1", score: 0.92 }),
      sug({ activityId: "p1:train2go:2", workoutId: "w-2", score: 0.85 }),
      sug({ activityId: "p1:train2go:3", workoutId: "w-3", score: 0.7 }),
      sug({ activityId: "p1:train2go:4", workoutId: "w-4", score: 0.68 }),
      sug({ activityId: "p1:train2go:5", workoutId: "w-5", score: 0.6 }),
    ],
    onAccept: fn(),
    onReject: fn(),
    resolveActivity,
    resolveWorkoutTitle,
  },
};

/** A candidate with no parsed duration renders the neutral "—", never a fake 50%. */
export const UnknownDurationScore: Story = {
  args: {
    suggestions: [
      sug({
        activityId: "p1:train2go:3",
        workoutId: "w-3",
        score: null,
        reasons: [
          { code: "duration-unknown" },
          { code: "sport-family-match", family: "swimming" },
        ],
      }),
    ],
    onAccept: fn(),
    onReject: fn(),
    resolveActivity,
    resolveWorkoutTitle,
  },
};

/** Without resolver props, rows fall back to the raw activity/workout ids. */
export const RawIdsWithoutResolvers: Story = {
  args: {
    suggestions: [
      sug(),
      sug({ activityId: "p1:train2go:9", workoutId: "w-9", score: 0.55 }),
    ],
    onAccept: fn(),
    onReject: fn(),
  },
};

/** No suggestions for this week — the banner renders nothing. */
export const NoSuggestions: Story = {
  args: {
    suggestions: [],
    onAccept: fn(),
    onReject: fn(),
  },
};
