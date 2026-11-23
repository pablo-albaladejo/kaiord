import { useTranslate } from "../i18n/use-translate";
import type { CoachingSport } from "../types/coaching-activity";

/** The `coaching` dictionary key that words a Coaching Activity's sport. */
export const coachingSportKey = (sport: CoachingSport): string =>
  `sport.${sport.id}`;

/** The athlete's word for a Coaching Activity's sport, in the active locale. */
export const useCoachingSportLabel = (sport: CoachingSport): string =>
  useTranslate("coaching")(coachingSportKey(sport));
