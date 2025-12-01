/**
 * KRD Builder Utilities
 *
 * Helper functions for building updated KRD objects.
 */

import type { KRD, Sport, SubSport } from "../../../../types/krd";

export function buildUpdatedKrd(
  krd: KRD,
  name: string,
  sport: Sport,
  subSport: SubSport
): KRD {
  const workoutData = krd.extensions?.workout;

  return {
    ...krd,
    metadata: {
      ...krd.metadata,
      sport,
      subSport,
    },
    extensions: {
      ...krd.extensions,
      workout:
        workoutData && typeof workoutData === "object" && "steps" in workoutData
          ? {
              ...(workoutData as Record<string, unknown>),
              name,
              sport,
              subSport,
            }
          : {
              name,
              sport,
              subSport,
              steps: [],
            },
    },
  };
}
