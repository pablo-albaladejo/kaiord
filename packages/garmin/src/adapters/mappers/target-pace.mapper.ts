import { createGarminParsingError } from "@kaiord/core";

import { TargetTypeId } from "../schemas/common";
import type { GarminTargetInfo, PaceZoneTable } from "./target-types";
import { buildTargetType } from "./target-types";

type Val = { unit: string; value?: number; min?: number; max?: number };

export const buildPaceTargetType = () =>
  buildTargetType(TargetTypeId.PACE_ZONE, "pace.zone", 6);

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
  return {
    targetType: buildPaceTargetType(),
    targetValueOne: entry.maxMps,
    targetValueTwo: entry.minMps,
    zoneNumber: null,
  };
};
