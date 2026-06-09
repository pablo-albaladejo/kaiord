import { type Sport, sportSchema } from "@kaiord/core";

import { type FitSport, fitSportSchema } from "../schemas/fit-sport";
import { FIT_TO_KRD_SPORT } from "./sport-map";

// FIT_TO_KRD_SPORT is 1:1 (no two FIT sports share a KRD sport), so inverting
// it is lossless — a no-collision test guards this invariant. The cast is safe
// because every KRD sport appears exactly once as a value above.
const KRD_TO_FIT_SPORT: Record<Sport, FitSport> = Object.fromEntries(
  Object.entries(FIT_TO_KRD_SPORT).map(([fit, krd]) => [krd, fit])
) as Record<Sport, FitSport>;

/**
 * Maps a FIT (camelCase) sport to its KRD (snake_case) counterpart.
 * Empty/invalid input falls back to `generic`.
 */
export const mapSportToKrd = (fitSport: unknown): Sport => {
  const result = fitSportSchema.safeParse(fitSport);

  if (!result.success) {
    return sportSchema.enum.generic;
  }

  return FIT_TO_KRD_SPORT[result.data] || sportSchema.enum.generic;
};

/**
 * Maps a KRD (snake_case) sport to its FIT (camelCase) counterpart.
 * Empty/invalid input falls back to `generic`.
 */
export const mapSportToFit = (krdSport: unknown): FitSport => {
  const result = sportSchema.safeParse(krdSport);

  if (!result.success) {
    return fitSportSchema.enum.generic;
  }

  return KRD_TO_FIT_SPORT[result.data] || fitSportSchema.enum.generic;
};

export { FIT_TO_KRD_SPORT, KRD_TO_FIT_SPORT };
