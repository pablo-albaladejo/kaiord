import { convertGarminToKRD } from "./converters/garmin-to-krd.converter";
import type { Logger, TextReader } from "@kaiord/core";

export const createGarminReader =
  (logger: Logger): TextReader =>
  async (gcnString: string) =>
    convertGarminToKRD(gcnString, logger);
