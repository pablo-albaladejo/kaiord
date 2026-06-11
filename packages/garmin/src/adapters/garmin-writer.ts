import type { Logger, TextWriter } from "@kaiord/core";
import { createUnsupportedKrdTypeError, isHealthFileType } from "@kaiord/core";

import { convertKRDToGarmin } from "./converters/krd-to-garmin.converter";
import type { TargetMapperOptions } from "./converters/target-types";

export type GarminWriterConfig = TargetMapperOptions & {
  logger: Logger;
};

export const createGarminWriter =
  (config: GarminWriterConfig): TextWriter =>
  async (krd) => {
    if (isHealthFileType(krd.type)) {
      throw createUnsupportedKrdTypeError(krd.type, "garmin");
    }
    return convertKRDToGarmin(krd, config);
  };
