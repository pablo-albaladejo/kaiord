/**
 * Executed-reference indexing for the auto-match use case. Split out of
 * `match-executed-workouts.ts` to keep both files under the per-file line cap.
 */
import type { ActivityRecord } from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";

const TRAIN2GO = "train2go";

/** An appendable executed reference: a renderable id + its canonical sport. */
export type ExecutedRef = { id: string; canonical: string | null };

export type CanonicalSport = (raw: string) => string | null;

const isExecuted = (w: WorkoutRecord): boolean => w.source !== TRAIN2GO;

const resolveActivityRef = (
  activity: ActivityRecord,
  workouts: readonly WorkoutRecord[],
  canonicalSport: CanonicalSport
): ExecutedRef => {
  const canonical = canonicalSport(activity.sport);
  const workout = workouts.find(
    (w) =>
      isExecuted(w) &&
      w.date === activity.date &&
      canonicalSport(w.sport) === canonical
  );
  return { id: workout?.id ?? activity.id, canonical };
};

/**
 * Index the executed side by date: the union of legacy executed workouts
 * (source !== train2go) and the v27 activities — each activity resolved to
 * its co-written renderable workout id, or its own id if none exists (F5).
 */
export const indexExecutedRefsByDate = (
  workouts: readonly WorkoutRecord[],
  activities: readonly ActivityRecord[],
  canonicalSport: CanonicalSport
): Map<string, ExecutedRef[]> => {
  const out = new Map<string, ExecutedRef[]>();
  const push = (date: string, ref: ExecutedRef): void => {
    const bucket = out.get(date) ?? [];
    bucket.push(ref);
    out.set(date, bucket);
  };
  for (const w of workouts) {
    if (!isExecuted(w)) continue;
    push(w.date, { id: w.id, canonical: canonicalSport(w.sport) });
  }
  for (const a of activities) {
    push(a.date, resolveActivityRef(a, workouts, canonicalSport));
  }
  return out;
};
