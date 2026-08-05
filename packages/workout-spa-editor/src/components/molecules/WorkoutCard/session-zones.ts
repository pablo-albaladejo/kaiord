/**
 * The zone facts a calendar card needs: the shape to draw and the single zone
 * the lateral border carries.
 *
 * Both come from the session's KRD. A record without one — a raw import, a
 * coach plan that has not been expanded — resolves to the empty profile, which
 * is what makes "Process all with AI" the thing that gives a card its colour.
 * A `CoachingActivity`'s `effort` is deliberately not consulted: it is an
 * effort rating, and drawing a zone from it would be an invention.
 */
import { thresholdsForSport } from "../../../lib/athlete";
import {
  dominantZone,
  getStructuredWorkout,
  zoneSeconds,
  type ZoneSegment,
  zoneSegments,
} from "../../../lib/workout-review";
import type { ZoneNumber } from "../../../lib/zone-colors";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { Profile } from "../../../types/profile";

export type SessionZones = {
  segments: ZoneSegment[];
  dominant: ZoneNumber | null;
};

const EMPTY_SESSION_ZONES: SessionZones = {
  segments: [],
  dominant: null,
};

export function sessionZones(
  record: Pick<WorkoutRecord, "krd" | "sport">,
  profile: Profile | null
): SessionZones {
  if (!record.krd) return EMPTY_SESSION_ZONES;
  const workout = getStructuredWorkout(record.krd);
  if (!workout) return EMPTY_SESSION_ZONES;
  const segments = zoneSegments(
    workout,
    thresholdsForSport(profile, record.sport)
  );
  if (segments.length === 0) return EMPTY_SESSION_ZONES;
  return { segments, dominant: dominantZone(zoneSeconds(segments)) };
}
