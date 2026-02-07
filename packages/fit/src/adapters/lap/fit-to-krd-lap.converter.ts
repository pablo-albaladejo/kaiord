import type { KRDLap } from "@kaiord/core";
import type { FitLap } from "../schemas/fit-lap";
import { fitLapSchema } from "../schemas/fit-lap";
import { mapFitLapToKrd } from "./lap.mapper";

/**
 * Converts a FIT LAP message to KRD lap format.
 *
 * @param data - Raw FIT LAP message data
 * @returns KRD lap object
 * @throws Error if FIT data is invalid
 */
export const convertFitToKrdLap = (data: Record<string, unknown>): KRDLap => {
  const fitLap = fitLapSchema.parse(data) as FitLap;
  return mapFitLapToKrd(fitLap);
};

/**
 * Batch converts FIT LAP messages to KRD laps.
 *
 * @param laps - Array of raw FIT LAP message data
 * @returns Array of KRD lap objects
 */
export const convertFitToKrdLaps = (
  laps: Record<string, unknown>[]
): KRDLap[] => {
  return laps.map(convertFitToKrdLap);
};
