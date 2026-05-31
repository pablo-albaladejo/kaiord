import type { Profile } from "../../types/profile";
import type { SportThresholds } from "../../types/sport-zones";

type SportZoneKey = keyof Profile["sportZones"];

/** Per-sport threshold lookup for a (possibly free-form) sport string.
    Returns an empty object when the profile or that sport has no thresholds,
    so callers can pass the result straight to the review derivation. */
export function thresholdsForSport(
  profile: Profile | null | undefined,
  sport: string
): SportThresholds {
  return profile?.sportZones[sport as SportZoneKey]?.thresholds ?? {};
}
