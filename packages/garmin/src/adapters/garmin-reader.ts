import type { GarminReader, Logger } from "@kaiord/core";
import { convertGarminToKRD } from "./converters/garmin-to-krd.converter";

export const createGarminReader =
  (logger: Logger): GarminReader =>
  async (gcnString: string) =>
    convertGarminToKRD(gcnString, logger);
