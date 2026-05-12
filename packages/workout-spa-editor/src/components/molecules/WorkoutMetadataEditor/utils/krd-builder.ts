/**
 * KRD Builder Utilities
 *
 * Helper functions for building updated KRD objects.
 */

import type { KRD, Sport, SubSport } from "../../../../types/krd";
import { getStructuredWorkout } from "../../../../utils/structured-workout";

export function buildUpdatedKrd(
  krd: KRD,
  name: string,
  sport: Sport,
  subSport: SubSport
): KRD {
  const structured = getStructuredWorkout(krd);

  return {
    ...krd,
    metadata: {
      ...krd.metadata,
      sport,
      subSport,
    },
    extensions: {
      ...krd.extensions,
      structured_workout: structured
        ? { ...structured, name, sport, subSport }
        : { name, sport, subSport, steps: [] },
    },
  };
}
