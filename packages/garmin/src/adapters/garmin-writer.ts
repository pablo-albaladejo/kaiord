import type { Logger, TextWriter } from "@kaiord/core";
import { convertKRDToGarmin } from "./converters/krd-to-garmin.converter";

export const createGarminWriter =
  (logger: Logger): TextWriter =>
  async (krd) =>
    convertKRDToGarmin(krd, logger);
