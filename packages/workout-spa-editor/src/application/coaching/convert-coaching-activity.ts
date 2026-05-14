/**
 * convertCoachingActivity — application use case
 *
 * Maps a CoachingActivityRecord to a WorkoutRecord (state: "raw") and
 * persists it. Profile-scoped idempotency: re-conversion within the same
 * profile returns the existing workout's id; conversion in a different
 * profile creates a distinct workout (sourceId is namespaced via
 * `namespaceSourceId(profileId, rawSourceId)` — see design D5).
 *
 * The originating coaching activity row is preserved (coach-owned data).
 *
 * On `WorkoutRepository.put` rejection the use case re-throws so the
 * caller (the dialog) can surface an error toast and stay on the dialog
 * — no navigation to a non-existent workout id.
 *
 * Concurrency note: the (getBySourceId → put) pair is NOT atomic. Two
 * concurrent clicks (e.g., two browser tabs) can both miss the lookup
 * and create different workout `id`s for the same `(source, sourceId)`.
 * Benign for a UI conversion — the user can delete the duplicate. A
 * robust fix requires either a deterministic workout id derived from
 * `(source, sourceId)` (a refactor that touches every workout call
 * site) or a Dexie transaction with a unique constraint. Tracked as
 * out-of-scope follow-up.
 */

import type {
  CoachingRepository,
  WorkoutRepository,
} from "../../ports/persistence-port";
import type { WorkoutRecord } from "../../types/calendar-schemas";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import { namespaceSourceId } from "../../types/coaching-activity-record";

export type ConvertCoachingActivityDeps = {
  coaching: CoachingRepository;
  workouts: WorkoutRepository;
  newId?: () => string;
  now?: () => string;
};

const buildRawWorkout = (
  id: string,
  activity: CoachingActivityRecord,
  namespacedSourceId: string,
  now: string
): WorkoutRecord => ({
  id,
  profileId: activity.profileId,
  date: activity.date,
  sport: activity.sport,
  source: activity.source,
  sourceId: namespacedSourceId,
  planId: null,
  state: "raw",
  raw: {
    title: activity.title,
    description: activity.description ?? "",
    comments: [],
    distance: null,
    duration: null,
    prescribedRpe: null,
    rawHash: "",
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
});

export const convertCoachingActivity = async (
  deps: ConvertCoachingActivityDeps,
  activityId: string
): Promise<{ workoutId: string; created: boolean }> => {
  const activity = await deps.coaching.getById(activityId);
  if (!activity) throw new Error(`Coaching activity not found: ${activityId}`);

  const nsSourceId = namespaceSourceId(activity.profileId, activity.sourceId);
  const existing = await deps.workouts.getBySourceId(
    activity.source,
    nsSourceId
  );
  if (existing) return { workoutId: existing.id, created: false };

  const newId = deps.newId ?? (() => crypto.randomUUID());
  const now = deps.now ?? (() => new Date().toISOString());
  const workout = buildRawWorkout(newId(), activity, nsSourceId, now());

  await deps.workouts.put(workout);
  return { workoutId: workout.id, created: true };
};
