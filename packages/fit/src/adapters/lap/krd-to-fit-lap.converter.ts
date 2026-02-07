import { krdLapSchema, type KRDLap } from "@kaiord/core";
import type { FitLap } from "../schemas/fit-lap";
import { mapKrdLapToFit } from "./lap.mapper";

/**
 * Converts a KRD lap to FIT LAP message format.
 *
 * @param data - KRD lap object
 * @returns Partial FIT LAP message data
 * @throws Error if KRD data is invalid
 */
export const convertKrdToFitLap = (
  data: Record<string, unknown>
): Partial<FitLap> => {
  const krdLap = krdLapSchema.parse(data) as KRDLap;
  return mapKrdLapToFit(krdLap);
};

/**
 * Batch converts KRD laps to FIT LAP messages.
 *
 * @param laps - Array of KRD lap objects
 * @returns Array of partial FIT LAP message data
 */
export const convertKrdToFitLaps = (
  laps: Record<string, unknown>[]
): Partial<FitLap>[] => {
  return laps.map(convertKrdToFitLap);
};
