import type { RepetitionBlock } from "@kaiord/core";
import {
  createOffStep,
  createOnStep,
  type ZwiftIntervalsTData,
} from "./intervals-t-helpers";

export type { ZwiftIntervalsTData };

/**
 * Map Zwift IntervalsT to KRD repetition block with 2 steps (on/off)
 * IntervalsT represents repeated intervals with distinct "on" and "off" phases
 */
export const mapIntervalsTToKrd = (
  data: ZwiftIntervalsTData
): RepetitionBlock => {
  return {
    repeatCount: data.Repeat,
    steps: [createOnStep(data), createOffStep(data)],
  };
};
