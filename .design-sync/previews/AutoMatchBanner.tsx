import type { MatchSuggestion } from "@ds-stories/packages/workout-spa-editor/src/application/match-suggestion";
import type { CoachingActivity } from "@ds-stories/packages/workout-spa-editor/src/types/coaching-activity";
import { AutoMatchBanner } from "@ds-stories/packages/workout-spa-editor/src/components/organisms/AutoMatchBanner/AutoMatchBanner";

/**
 * `AutoMatchBanner` takes only real props (no context/store dependency), so
 * the fixtures below are the only thing that matters — copied from
 * `AutoMatchBanner.stories.tsx`. `MatchSuggestion.reasons[0]` MUST be the
 * `sport-family-match` entry (see the type's own doc comment); every
 * suggestion below respects that ordering.
 */
const noop = () => {};

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

export const TwoHighConfidenceMatches = () => (
  <AutoMatchBanner
    suggestions={[
      sug({ activityId: "p1:train2go:1", workoutId: "w-1", score: 0.92 }),
      sug({
        activityId: "p1:train2go:2",
        workoutId: "w-2",
        score: 0.85,
        reasons: [
          { code: "sport-family-match", family: "running" },
          { code: "duration-match", deltaSeconds: 60 },
        ],
      }),
    ]}
    onAccept={noop}
    onReject={noop}
    resolveActivity={resolveActivity}
    resolveWorkoutTitle={resolveWorkoutTitle}
  />
);

export const OverflowWithFiveSuggestions = () => (
  <AutoMatchBanner
    suggestions={[
      sug({ activityId: "p1:train2go:1", workoutId: "w-1", score: 0.92 }),
      sug({ activityId: "p1:train2go:2", workoutId: "w-2", score: 0.85 }),
      sug({ activityId: "p1:train2go:3", workoutId: "w-3", score: 0.7 }),
      sug({ activityId: "p1:train2go:4", workoutId: "w-4", score: 0.68 }),
      sug({ activityId: "p1:train2go:5", workoutId: "w-5", score: 0.6 }),
    ]}
    onAccept={noop}
    onReject={noop}
    resolveActivity={resolveActivity}
    resolveWorkoutTitle={resolveWorkoutTitle}
  />
);

export const UnknownDurationScore = () => (
  <AutoMatchBanner
    suggestions={[
      sug({
        activityId: "p1:train2go:3",
        workoutId: "w-3",
        score: null,
        reasons: [
          { code: "duration-unknown" },
          { code: "sport-family-match", family: "swimming" },
        ],
      }),
    ]}
    onAccept={noop}
    onReject={noop}
    resolveActivity={resolveActivity}
    resolveWorkoutTitle={resolveWorkoutTitle}
  />
);

export const RawIdsWithoutResolvers = () => (
  <AutoMatchBanner
    suggestions={[
      sug(),
      sug({ activityId: "p1:train2go:9", workoutId: "w-9", score: 0.55 }),
    ]}
    onAccept={noop}
    onReject={noop}
  />
);

export const NoSuggestions = () => (
  <AutoMatchBanner suggestions={[]} onAccept={noop} onReject={noop} />
);
