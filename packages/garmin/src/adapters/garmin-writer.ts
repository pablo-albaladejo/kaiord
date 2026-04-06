import type { Logger, TextWriter } from "@kaiord/core";

import { convertKRDToGarmin } from "./converters/krd-to-garmin.converter";
import type { TargetMapperOptions } from "./mappers/target.mapper";

export type GarminWriterConfig = TargetMapperOptions & {
  logger: Logger;
};

export const createGarminWriter =
  (config: GarminWriterConfig): TextWriter =>
  async (krd) =>
    convertKRDToGarmin(krd, config);
