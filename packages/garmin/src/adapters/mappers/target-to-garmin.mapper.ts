import type { Target } from "@kaiord/core";

import { TargetTypeId } from "../schemas/common";
import { buildPaceTargetType, resolvePaceZone } from "./target-pace.mapper";
import type {
  GarminTargetInfo,
  PaceZoneTable,
  TargetMapperOptions,
} from "./target-types";
import { buildTargetType } from "./target-types";

type Val = { unit: string; value?: number; min?: number; max?: number };
type TT = GarminTargetInfo["targetType"];

export const mapKrdTargetToGarmin = (
  target: Target,
  options?: TargetMapperOptions
): GarminTargetInfo => {
  switch (target.type) {
    case "power":
      return mapZoneOrRange(
        buildTargetType(TargetTypeId.POWER_ZONE, "power.zone", 2),
        target.value,
        true
      );
    case "heart_rate":
      return mapZoneOrRange(
        buildTargetType(TargetTypeId.HEART_RATE_ZONE, "heart.rate.zone", 4),
        target.value,
        false
      );
    case "pace":
      return mapPace(target.value, options?.paceZones);
    case "cadence":
      return mapRangeOrValue(
        buildTargetType(TargetTypeId.CADENCE_ZONE, "cadence", 3),
        target.value,
        false
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
  return mapRangeOrValue(buildPaceTargetType(), value, true);
};

const mapZoneOrRange = (
  tt: TT,
  value: Val,
  fasterFirst: boolean
): GarminTargetInfo => {
  if (value.unit === "zone") {
    return {
      targetType: tt,
      targetValueOne: null,
      targetValueTwo: null,
      zoneNumber: value.value ?? null,
    };
  }
  return mapRangeOrValue(tt, value, fasterFirst);
};

const mapRangeOrValue = (
  tt: TT,
  value: Val,
  fasterFirst: boolean
): GarminTargetInfo => {
  if (value.unit === "range") {
    const min = value.min ?? null;
    const max = value.max ?? null;
    const [one, two] =
      fasterFirst && min !== null && max !== null ? [max, min] : [min, max];
    return {
      targetType: tt,
      targetValueOne: one,
      targetValueTwo: two,
      zoneNumber: null,
    };
  }
  return {
    targetType: tt,
    targetValueOne: value.value ?? null,
    targetValueTwo: value.value ?? null,
    zoneNumber: null,
  };
};
