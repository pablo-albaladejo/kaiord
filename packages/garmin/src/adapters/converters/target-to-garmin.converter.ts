import type { Target } from "@kaiord/core";

import {
  buildCadenceBand,
  buildHeartRateBand,
  buildPowerBand,
} from "../mappers/target-band.mapper";
import {
  buildPaceBand,
  buildPaceTargetType,
  resolvePaceZone,
} from "../mappers/target-pace.mapper";
import { TargetTypeId } from "../schemas/common";
import { resolvePercentMaxToBpm } from "./target-heart-rate.converter";
import { resolvePercentFtpToWatts } from "./target-power.converter";
import { mapRangeOrValue, mapZoneOrRange } from "./target-range.converter";
import type {
  GarminTargetInfo,
  PaceZoneTable,
  TargetMapperOptions,
} from "./target-types";
import { buildTargetType } from "./target-types";

type Val = { unit: string; value?: number; min?: number; max?: number };

export const convertKrdTargetToGarmin = (
  target: Target,
  options?: TargetMapperOptions
): GarminTargetInfo => {
  switch (target.type) {
    case "power":
      return mapZoneOrRange(
        buildTargetType(TargetTypeId.POWER_ZONE, "power.zone", 2),
        resolvePercentFtpToWatts(target.value, options?.ftpWatts),
        true,
        buildPowerBand
      );
    case "heart_rate":
      return mapZoneOrRange(
        buildTargetType(TargetTypeId.HEART_RATE_ZONE, "heart.rate.zone", 4),
        resolvePercentMaxToBpm(target.value, options?.maxHeartRate),
        false,
        buildHeartRateBand
      );
    case "pace":
      return mapPace(target.value, options?.paceZones);
    case "cadence":
      return mapRangeOrValue(
        buildTargetType(TargetTypeId.CADENCE_ZONE, "cadence", 3),
        target.value,
        false,
        buildCadenceBand
      );
    case "open":
    default:
      return {
        targetType: buildTargetType(TargetTypeId.NO_TARGET, "no.target", 1),
        targetValueOne: null,
        targetValueTwo: null,
        zoneNumber: null,
      };
  }
};

const mapPace = (value: Val, paceZones?: PaceZoneTable): GarminTargetInfo => {
  if (value.unit === "zone") return resolvePaceZone(value, paceZones);
  const band =
    value.unit === "mps" && value.value != null
      ? buildPaceBand(value.value)
      : null;
  return band ?? mapRangeOrValue(buildPaceTargetType(), value, true);
};
