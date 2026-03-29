/**
 * @kaiord/garmin - Garmin Connect API (GCN) format adapter for Kaiord
 */

import { createConsoleLogger } from "@kaiord/core";
import { createGarminReader as createGarminReaderImpl } from "./adapters/garmin-reader";
import { createGarminWriter as createGarminWriterImpl } from "./adapters/garmin-writer";
import type { PaceZoneTable } from "./adapters/mappers/target.mapper";
import type { Logger, TextReader, TextWriter } from "@kaiord/core";

export type {
  PaceZoneTable,
  PaceZoneEntry,
} from "./adapters/mappers/target.mapper";

export type GarminWriterOptions = {
  logger?: Logger;
  paceZones?: PaceZoneTable;
};

export const createGarminReader = (logger?: Logger): TextReader =>
  createGarminReaderImpl(logger || createConsoleLogger());

export const createGarminWriter = (
  options?: Logger | GarminWriterOptions
): TextWriter => {
  const isLogger = (v: unknown): v is Logger =>
    v !== null && typeof v === "object" && "info" in v;

  if (!options || isLogger(options)) {
    return createGarminWriterImpl({
      logger: options || createConsoleLogger(),
    });
  }
  return createGarminWriterImpl({
    logger: options.logger || createConsoleLogger(),
    paceZones: options.paceZones,
  });
};

export const garminReader: TextReader = createGarminReader();
export const garminWriter: TextWriter = createGarminWriter();

export type { WorkoutToGarminOptions } from "./adapters/workout-to-garmin";
export {
  createWorkoutToGarmin,
  workoutToGarmin,
} from "./adapters/workout-to-garmin";
