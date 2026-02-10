import type { RepetitionBlock, Sport, WorkoutStep } from "@kaiord/core";
import { sportSchema } from "@kaiord/core";

/**
 * Type guard to check if a step is a RepetitionBlock
 */
export const isRepetitionBlock = (
  step: WorkoutStep | RepetitionBlock
): step is RepetitionBlock => {
  return "repeatCount" in step;
};

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
