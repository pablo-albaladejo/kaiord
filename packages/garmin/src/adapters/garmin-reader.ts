import type { Logger, TextReader } from "@kaiord/core";
import { convertGarminToKRD } from "./converters/garmin-to-krd.converter";

export const createGarminReader =
  (logger: Logger): TextReader =>
  async (gcnString: string) =>
    convertGarminToKRD(gcnString, logger);
