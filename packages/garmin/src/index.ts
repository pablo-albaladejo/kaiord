/**
 * @kaiord/garmin - Garmin Connect API (GCN) format adapter for Kaiord
 */

import type { Logger, TextReader, TextWriter } from "@kaiord/core";
import { createConsoleLogger } from "@kaiord/core";

import type { PaceZoneTable } from "./adapters/converters/target-types";
import { createGarminReader as createGarminReaderImpl } from "./adapters/garmin-reader";
import { createGarminWriter as createGarminWriterImpl } from "./adapters/garmin-writer";
import { isLogger } from "./adapters/utils/is-logger";

export type {
  PaceZoneEntry,
  PaceZoneTable,
} from "./adapters/converters/target-types";
export { mapGarminSportToKrd } from "./adapters/mappers/sport.mapper";

export type GarminWriterOptions = {
  logger?: Logger;
  paceZones?: PaceZoneTable;
};

export const createGarminReader = (logger?: Logger): TextReader =>
  createGarminReaderImpl(logger || createConsoleLogger());

export const createGarminWriter = (
  options?: Logger | GarminWriterOptions
): TextWriter => {
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
