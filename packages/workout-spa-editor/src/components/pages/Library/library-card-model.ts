import type { Translate } from "../../../i18n/use-translate";
import { thresholdsForSport } from "../../../lib/athlete";
import { buildReviewModel } from "../../../lib/workout-review";
import type { Profile } from "../../../types/profile";
import type { WorkoutTemplate } from "../../../types/workout-library";

export type LibraryCardModel = {
  title: string;
  sportLabel: string;
  duration?: string;
  tss?: number;
  dist?: number[];
  tag?: string;
};

/* `library.sport.*` already carries every sport the filter chips offer, so the
   row's word for a sport and the chip's are the same string. An unrecognised
   sport falls back to its stored key rather than to an empty meta segment. */
const sportLabelFor = (sport: string, t: Translate): string => {
  const key = sport === "swimming" ? "sport.swim" : `sport.${sport}`;
  const label = t(key);
  return label === key ? sport : label;
};

/**
 * Derives the display fields for a `LibraryCard` from a template. When the
 * template's KRD cannot be reviewed (absent structure) TSS / duration /
 * zone distribution are omitted so the card degrades gracefully.
 */
export function buildLibraryCardModel(
  template: WorkoutTemplate,
  profile: Profile | null,
  t: Translate
): LibraryCardModel {
  const tag = template.tags[0];
  const sportLabel = sportLabelFor(template.sport, t);
  const thresholds = thresholdsForSport(profile, template.sport);
  const review = buildReviewModel(template.krd, thresholds, template.name);

  if (!review) {
    return { title: template.name, sportLabel, tag };
  }

  return {
    title: template.name,
    sportLabel,
    duration: review.duration,
    tss: review.tss,
    dist: review.dist,
    tag,
  };
}
