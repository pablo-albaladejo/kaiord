import type { TextWriter } from "@kaiord/core";
import { createUnsupportedKrdTypeError, isHealthFileType } from "@kaiord/core";

import {
  convertKRDToGarmin,
  type GarminWriterOptions,
} from "./converters/krd-to-garmin.converter";

export const createGarminWriter =
  (config: GarminWriterOptions): TextWriter =>
  async (krd) => {
    if (isHealthFileType(krd.type)) {
      throw createUnsupportedKrdTypeError(krd.type, "garmin");
    }
    return convertKRDToGarmin(krd, config);
  };
