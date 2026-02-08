import type { GarminReader, GarminWriter, Logger } from "@kaiord/core";
import { createConsoleLogger } from "@kaiord/core";
import { createGarminReader } from "./adapters/garmin-reader";
import { createGarminWriter } from "./adapters/garmin-writer";

export type GarminProviders = {
  garminReader: GarminReader;
  garminWriter: GarminWriter;
};

export const createGarminProviders = (logger?: Logger): GarminProviders => {
  const log = logger || createConsoleLogger();

  return {
    garminReader: createGarminReader(log),
    garminWriter: createGarminWriter(log),
  };
};
