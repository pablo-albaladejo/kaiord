import { createConsoleLogger, createWorkoutKRD, toText } from "@kaiord/core";
import { createGarminWriter } from "./garmin-writer";
import type { GarminWriterConfig } from "./garmin-writer";
import type { Logger } from "@kaiord/core";

export type WorkoutToGarminOptions = {
  logger?: Logger;
  paceZones?: GarminWriterConfig["paceZones"];
};

export const createWorkoutToGarmin =
  (options?: Logger | WorkoutToGarminOptions) =>
  async (workout: unknown): Promise<string> => {
    const resolved = resolveOptions(options);
    const krd = createWorkoutKRD(workout);
    return toText(krd, createGarminWriter(resolved), resolved.logger);
  };

export const workoutToGarmin = createWorkoutToGarmin();

const resolveOptions = (
  options?: Logger | WorkoutToGarminOptions
): GarminWriterConfig => {
  if (!options) return { logger: createConsoleLogger() };
  if ("info" in options) return { logger: options };
  return {
    logger: options.logger ?? createConsoleLogger(),
    paceZones: options.paceZones,
  };
};
