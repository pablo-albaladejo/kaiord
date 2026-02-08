import type { GarminWriter, Logger } from "@kaiord/core";
import { convertKRDToGarmin } from "./converters/krd-to-garmin.converter";

export const createGarminWriter =
  (logger: Logger): GarminWriter =>
  async (krd) =>
    convertKRDToGarmin(krd, logger);
