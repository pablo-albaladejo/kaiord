import { createGarminParsingError } from "@kaiord/core";

import type {
  GarminTargetInfo,
  PaceZoneTable,
} from "../converters/target-types";
import { buildTargetType } from "../converters/target-types";
import { TargetTypeId } from "../schemas/common";

type Val = { unit: string; value?: number; min?: number; max?: number };

export const buildPaceTargetType = () =>
  buildTargetType(TargetTypeId.PACE_ZONE, "pace.zone", 6);

/** Half-width of the band a single pace value is widened to, in s/km. */
export const PACE_BAND_HALF_WIDTH_SEC_PER_KM = 5;

/**
 * Garmin has no single-value pace target: sending the same speed as both
 * bounds yields a zero-width "4:45-4:45 min/km" alert that fires whenever
 * the runner is off that exact pace. Widen it to ±5 s/km in pace space,
 * fastest-bound-first like ranges. Non-positive speeds have no finite pace,
 * so they return null and the caller keeps its passthrough behaviour.
 */
export const buildPaceBand = (mps: number): GarminTargetInfo | null => {
  const secPerKm = 1000 / mps;
  const fasterSecPerKm = secPerKm - PACE_BAND_HALF_WIDTH_SEC_PER_KM;
  if (!(mps > 0) || !(fasterSecPerKm > 0)) return null;
  return {
    targetType: buildPaceTargetType(),
    targetValueOne: 1000 / fasterSecPerKm,
    targetValueTwo: 1000 / (secPerKm + PACE_BAND_HALF_WIDTH_SEC_PER_KM),
    zoneNumber: null,
  };
};

export const resolvePaceZone = (
  value: Val,
  paceZones: PaceZoneTable | undefined
): GarminTargetInfo => {
  if (!paceZones) {
    throw createGarminParsingError(
      "Pace zone references require paceZones configuration. " +
        "Garmin Connect does not support pace zone numbers natively."
    );
  }
  const entry = paceZones.find((z) => z.zone === (value.value ?? 0));
  if (!entry) {
    throw createGarminParsingError(
      `Pace zone ${value.value} not found in pace zone table`
    );
  }
  // Garmin orders speed/power targets fastest-bound-first: the higher speed
  // (maxMps, the faster pace) goes in targetValueOne, the slower (minMps) in
  // targetValueTwo. HR/cadence targets order ascending instead.
  return {
    targetType: buildPaceTargetType(),
    targetValueOne: entry.maxMps,
    targetValueTwo: entry.minMps,
    zoneNumber: null,
  };
};
