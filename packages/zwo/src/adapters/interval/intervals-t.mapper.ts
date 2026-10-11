import type { Logger, RepetitionBlock } from "@kaiord/core";

import type { ZwiftIntervalsTData } from "./intervals-t-helpers";
import { createOffStep, createOnStep } from "./intervals-t-helpers";
import { restoreIntervalsTStep } from "./intervals-t-restoration";

export type { ZwiftIntervalsTData };

/**
 * Map Zwift IntervalsT to KRD repetition block with 2 steps (on/off)
 * IntervalsT represents repeated intervals with distinct "on" and "off" phases
 */
export const mapIntervalsTToKrd = (
  data: ZwiftIntervalsTData,
  logger?: Logger
): RepetitionBlock => {
  return {
    repeatCount: data.Repeat,
    steps: [
      restoreIntervalsTStep(createOnStep(data), data, "on", logger),
      restoreIntervalsTStep(createOffStep(data), data, "off", logger),
    ],
  };
};
