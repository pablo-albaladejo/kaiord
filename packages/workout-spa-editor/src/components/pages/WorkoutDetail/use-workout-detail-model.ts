import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { thresholdsForSport } from "../../../lib/athlete";
import {
  buildReviewModel,
  type ReviewModel,
} from "../../../lib/workout-review";
import type { WorkoutRecord } from "../../../types/calendar-record";

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

  const thresholds = thresholdsForSport(profile, record.sport);
  const fallback =
    (record.raw as { description?: string } | null)?.description ??
    FALLBACK_TITLE;

  return buildReviewModel(record.krd, thresholds, fallback);
}
