/**
 * Executed-reference indexing for the auto-match use case.
 */
import type { ActivityRecord } from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";

const TRAIN2GO = "train2go";

/** An appendable executed reference: a renderable id + its canonical sport. */
export type ExecutedRef = { id: string; canonical: string | null };

export type CanonicalSport = (raw: string) => string | null;

const isExecuted = (w: WorkoutRecord): boolean => w.source !== TRAIN2GO;

/**
 * Index the executed side by date: the union of v27 activities and the legacy
 * executed workouts (source !== train2go), EXCLUDING every workout whose id is
 * the twin (`linkedWorkoutId`) of an activity — so a dual-written event is
 * matched once. Each activity appends its twin's renderable id, or its own id
 * when it has no twin (e.g. a future Garmin pull).
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
  const linked = new Set(
    activities
      .map((a) => a.linkedWorkoutId)
      .filter((id): id is string => id !== null)
  );
  for (const w of workouts) {
    if (!isExecuted(w) || linked.has(w.id)) continue;
    push(w.date, { id: w.id, canonical: canonicalSport(w.sport) });
  }
  for (const a of activities) {
    push(a.date, {
      id: a.linkedWorkoutId ?? a.id,
      canonical: canonicalSport(a.sport),
    });
  }
  return out;
};
