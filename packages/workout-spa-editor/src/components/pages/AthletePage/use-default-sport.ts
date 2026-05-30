import {
  type ActiveSport,
  ATHLETE_SPORTS,
  deriveZoneMap,
} from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";

const FALLBACK_SPORT: ActiveSport = "cycling";

/** First sport with a derivable zone map for the profile, else "cycling".
    Pure helper used to seed the page's local sport state once. */
export function defaultSport(profile: Profile): ActiveSport {
  const withZones = ATHLETE_SPORTS.find(
    (sport) => deriveZoneMap(profile, sport.value) !== null
  );
  return withZones?.value ?? FALLBACK_SPORT;
}
