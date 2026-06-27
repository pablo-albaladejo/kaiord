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
  subSport: SubSport,
  notes?: string
): KRD {
  const structured = getStructuredWorkout(krd);
  // Empty notes are omitted (no empty-string notes are written), mirroring the
  // coaching builder's behavior.
  const notesPatch = notes ? { notes } : { notes: undefined };

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
        ? { ...structured, name, sport, subSport, ...notesPatch }
        : { name, sport, subSport, steps: [], ...notesPatch },
    },
  };
}
