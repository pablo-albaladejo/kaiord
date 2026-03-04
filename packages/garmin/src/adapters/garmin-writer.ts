import { convertKRDToGarmin } from "./converters/krd-to-garmin.converter";
import type { Logger, TextWriter } from "@kaiord/core";

export const createGarminWriter =
  (logger: Logger): TextWriter =>
  async (krd) =>
    convertKRDToGarmin(krd, logger);
