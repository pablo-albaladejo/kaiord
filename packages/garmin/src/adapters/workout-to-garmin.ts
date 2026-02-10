import type { Logger } from "@kaiord/core";
import { createConsoleLogger, createWorkoutKRD, toText } from "@kaiord/core";
import { createGarminWriter } from "./garmin-writer";

/**
 * Creates a function that converts a Workout directly to Garmin Connect JSON.
 *
 * Composition facade: wraps application-layer orchestration (toText) with
 * the garmin writer. This is a convenience for consumers who don't need
 * the intermediate KRD step.
 *
 * Input is validated against workoutSchema.
 * Throws KrdValidationError if the workout structure is invalid.
 *
 * @param logger - Optional logger (defaults to console logger)
 * @returns Function that converts unknown workout data to Garmin JSON string
 */
export const createWorkoutToGarmin =
  (logger?: Logger) =>
  async (workout: unknown): Promise<string> => {
    const log = logger ?? createConsoleLogger();
    const krd = createWorkoutKRD(workout);
    return toText(krd, createGarminWriter(log), log);
  };

/**
 * Converts a Workout directly to Garmin Connect JSON format.
 * Pre-built instance using the default console logger.
 */
export const workoutToGarmin = createWorkoutToGarmin();
