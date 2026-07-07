/**
 * Executed-reference indexing for the auto-match use case.
 *
 * The executed side is the v27 `activities` table — the single source of
 * truth for executed sessions. Each activity contributes one ref: its twin
 * WorkoutRecord id when it has one (historical dual-write), otherwise its own
 * id (source-only pulls like Garmin, projected for render by the read model).
 */
import type { ActivityRecord } from "../../types/activity-record";

/** An appendable executed reference: a renderable id + its canonical sport. */
export type ExecutedRef = { id: string; canonical: string | null };

export type CanonicalSport = (raw: string) => string | null;

export const indexExecutedRefsByDate = (
  activities: readonly ActivityRecord[],
  canonicalSport: CanonicalSport
): Map<string, ExecutedRef[]> => {
  const out = new Map<string, ExecutedRef[]>();
  for (const a of activities) {
    const bucket = out.get(a.date) ?? [];
    bucket.push({
      id: a.linkedWorkoutId ?? a.id,
      canonical: canonicalSport(a.sport),
    });
    out.set(a.date, bucket);
  }
  return out;
};
