/**
 * `reviewFor` — the review view-model (incl. measured TSS) for a workout that
 * carries a parsed KRD, using the athlete's sport thresholds. Returns `null`
 * for a KRD-less (raw) workout, so callers treat such days as presence-only
 * (no fabricated load).
 */
import { thresholdsForSport } from "../../../lib/athlete";
import {
  buildReviewModel,
  type ReviewModel,
} from "../../../lib/workout-review";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { Profile } from "../../../types/profile";

const FALLBACK_TITLE = "Workout";

export function reviewFor(
  record: WorkoutRecord,
  profile: Profile | null
): ReviewModel | null {
  if (!record.krd) return null;
  const thresholds = thresholdsForSport(profile, record.sport);
  return buildReviewModel(record.krd, thresholds, FALLBACK_TITLE);
}
