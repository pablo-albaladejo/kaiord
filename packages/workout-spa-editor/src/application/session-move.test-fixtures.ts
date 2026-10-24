import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { WorkoutRecord } from "../types/calendar-record";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
  namespaceSourceId,
} from "../types/coaching-activity-record";
import type { SessionMatch } from "../types/session-match";
import { makeWorkoutRecord } from "./test-helpers";

export const PROFILE = "p1";
export const SOURCE_ID = "77";
export const NOW = "2026-10-01T08:00:00.000Z";
export const TUE = "2026-10-06";
export const THU = "2026-10-08";
export const FRI = "2026-10-09";
export const ACTIVITY_ID = buildCoachingActivityId(
  PROFILE,
  "train2go",
  SOURCE_ID
);

export const coachActivity = (
  overrides: Partial<CoachingActivityRecord> = {}
): CoachingActivityRecord => ({
  id: ACTIVITY_ID,
  profileId: PROFILE,
  source: "train2go",
  sourceId: SOURCE_ID,
  date: TUE,
  sport: "cycling",
  title: "Threshold",
  status: "pending",
  fetchedAt: NOW,
  ...overrides,
});

export const coachWorkout = (
  overrides: Partial<WorkoutRecord> = {}
): WorkoutRecord =>
  makeWorkoutRecord({
    id: "w",
    profileId: PROFILE,
    date: TUE,
    coachDate: TUE,
    source: "train2go",
    sourceId: namespaceSourceId(PROFILE, SOURCE_ID),
    state: "ready",
    ...overrides,
  });

export const sessionMatch = (
  overrides: Partial<SessionMatch> = {}
): SessionMatch => ({
  id: "m",
  profileId: PROFILE,
  coachingActivityId: ACTIVITY_ID,
  workoutId: "w",
  date: TUE,
  createdAt: NOW,
  source: "auto-coaching",
  executedWorkoutIds: [],
  ...overrides,
});

/** In-memory persistence seeded with a coach session: activity, workout, match. */
export const seedSession = async (
  seed: {
    activity?: Partial<CoachingActivityRecord>;
    workout?: Partial<WorkoutRecord>;
    match?: Partial<SessionMatch> | null;
  } = {}
) => {
  const persistence = createInMemoryPersistence();
  await persistence.coaching.upsertMany([coachActivity(seed.activity)]);
  await persistence.workouts.put(coachWorkout(seed.workout));
  if (seed.match !== null)
    await persistence.sessionMatch.put(sessionMatch(seed.match));
  return persistence;
};
