import type { Sport } from "@kaiord/core";
import { sportSchema } from "@kaiord/core";

/**
 * Default values for FIT file generation and mapping
 */
export const DEFAULT_MANUFACTURER = "development" as const;
export const DEFAULT_SPORT = sportSchema.enum.cycling;

/**
 * Maps FIT sport type to KRD sport type
 * Returns DEFAULT_SPORT if fitSport is undefined
 */
export const mapSportType = (fitSport: string | undefined): Sport => {
  if (!fitSport) {
    return DEFAULT_SPORT;
  }
  const lower = fitSport.toLowerCase();
  const result = sportSchema.safeParse(lower);
  return result.success ? result.data : DEFAULT_SPORT;
};
