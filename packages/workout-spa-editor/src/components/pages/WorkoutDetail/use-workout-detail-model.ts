import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import {
  buildReviewModel,
  type ReviewModel,
} from "../../../lib/workout-review";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { SportThresholds } from "../../../types/sport-zones";

const FALLBACK_TITLE = "Workout";

/**
 * Derives the read-only review view-model for a workout record, selecting the
 * active profile's per-sport thresholds. Returns `null` when the record has no
 * generated KRD (callers render a minimal state).
 */
export function useWorkoutDetailModel(
  record: WorkoutRecord | undefined
): ReviewModel | null {
  const profile = useActiveProfileLive()?.profile;
  if (!record?.krd) return null;

  // `record.sport` is a free-form string; narrow it to the typed sport-zones
  // keys (lookup is undefined-safe for any non-matching sport).
  const sportKey = record.sport as keyof NonNullable<
    typeof profile
  >["sportZones"];
  const thresholds: SportThresholds =
    profile?.sportZones[sportKey]?.thresholds ?? {};
  const fallback =
    (record.raw as { description?: string } | null)?.description ??
    FALLBACK_TITLE;

  return buildReviewModel(record.krd, thresholds, fallback);
}
