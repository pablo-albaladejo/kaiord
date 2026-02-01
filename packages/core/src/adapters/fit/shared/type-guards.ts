import { sportSchema } from "../../../domain/schemas/sport";
import type {
  RepetitionBlock,
  WorkoutStep,
} from "../../../domain/schemas/workout";

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
export const mapSportType = (fitSport: string | undefined): string => {
  if (!fitSport) {
    return DEFAULT_SPORT;
  }
  return fitSport.toLowerCase();
};
