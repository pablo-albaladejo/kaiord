/**
 * @kaiord/garmin - Garmin Connect API (GCN) format adapter for Kaiord
 */

import type { Logger, TextReader, TextWriter } from "@kaiord/core";
import { createConsoleLogger } from "@kaiord/core";
import { createGarminReader as createGarminReaderImpl } from "./adapters/garmin-reader";
import { createGarminWriter as createGarminWriterImpl } from "./adapters/garmin-writer";

export const createGarminReader = (logger?: Logger): TextReader =>
  createGarminReaderImpl(logger || createConsoleLogger());

export const createGarminWriter = (logger?: Logger): TextWriter =>
  createGarminWriterImpl(logger || createConsoleLogger());

export const garminReader: TextReader = createGarminReader();
export const garminWriter: TextWriter = createGarminWriter();

export {
  createWorkoutToGarmin,
  workoutToGarmin,
} from "./adapters/workout-to-garmin";
