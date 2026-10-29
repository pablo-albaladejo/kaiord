/**
 * @kaiord/fit - FIT format adapter for Kaiord
 */

import type { BinaryReader, BinaryWriter, Logger } from "@kaiord/core";
import { createConsoleLogger } from "@kaiord/core";

import type { FitWriterOptions } from "./adapters/create-encoder";
import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "./adapters/garmin-fitsdk";

export {
  encodeBodyCompositionFit,
  encodeFitMessages,
} from "./adapters/garmin-fitsdk";

export const createFitReader = (logger?: Logger): BinaryReader =>
  createGarminFitSdkReader(logger || createConsoleLogger());

export const createFitWriter = (
  logger?: Logger,
  options?: FitWriterOptions
): BinaryWriter =>
  createGarminFitSdkWriter(logger || createConsoleLogger(), options);

export const fitReader: BinaryReader = createFitReader();
export const fitWriter: BinaryWriter = createFitWriter();

export { createGarminFitSdkReader, createGarminFitSdkWriter };
export type { FitWriterOptions };
