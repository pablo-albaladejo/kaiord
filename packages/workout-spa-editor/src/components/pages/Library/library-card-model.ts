import { buildReviewModel } from "../../../lib/workout-review";
import type { Profile } from "../../../types/profile";
import type { SportThresholds } from "../../../types/sport-zones";
import type { WorkoutTemplate } from "../../../types/workout-library";

export type LibraryCardModel = {
  title: string;
  sport: string;
  duration?: string;
  tss?: number;
  dist?: number[];
  tag?: string;
};

type SportZoneKey = keyof Profile["sportZones"];

/**
 * Derives the display fields for a `LibraryCard` from a template. When the
 * template's KRD cannot be reviewed (absent structure) TSS / duration /
 * zone distribution are omitted so the card degrades gracefully.
 */
export function buildLibraryCardModel(
  template: WorkoutTemplate,
  profile: Profile | null
): LibraryCardModel {
  const tag = template.tags[0];
  const sportKey = template.sport as SportZoneKey;
  const thresholds: SportThresholds =
    profile?.sportZones[sportKey]?.thresholds ?? {};
  const review = buildReviewModel(template.krd, thresholds, template.name);

  if (!review) {
    return { title: template.name, sport: template.sport, tag };
  }

  return {
    title: template.name,
    sport: template.sport,
    duration: review.duration,
    tss: review.tss,
    dist: review.dist,
    tag,
  };
}
