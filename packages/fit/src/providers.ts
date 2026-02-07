import type { FitReader, FitWriter, Logger } from "@kaiord/core";
import { createConsoleLogger } from "@kaiord/core";
import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "./adapters/garmin-fitsdk";

export type FitProviders = {
  fitReader: FitReader;
  fitWriter: FitWriter;
};

export const createFitProviders = (logger?: Logger): FitProviders => {
  const log = logger || createConsoleLogger();

  return {
    fitReader: createGarminFitSdkReader(log),
    fitWriter: createGarminFitSdkWriter(log),
  };
};
