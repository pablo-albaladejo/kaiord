import { createGarminParsingError } from "@kaiord/core";
import { buildTargetType } from "./target-types";
import { TargetTypeId } from "../schemas/common";
import type {
  GarminTargetInfo,
  PaceZoneTable,
  TargetMapperOptions,
} from "./target-types";
import type { Target } from "@kaiord/core";

type ValueShape = { unit: string; value?: number; min?: number; max?: number };
type TT = GarminTargetInfo["targetType"];

export const mapKrdTargetToGarmin = (
  target: Target,
  options?: TargetMapperOptions
): GarminTargetInfo => {
  switch (target.type) {
    case "power":
      return mapZoneOrRange(
        buildTargetType(TargetTypeId.POWER_ZONE, "power.zone", 2),
        target.value
      );
    case "heart_rate":
      return mapZoneOrRange(
        buildTargetType(TargetTypeId.HEART_RATE_ZONE, "heart.rate.zone", 4),
        target.value
      );
    case "pace":
      return mapPace(target.value, options?.paceZones);
    case "cadence":
      return mapRangeOrValue(
        buildTargetType(TargetTypeId.CADENCE_ZONE, "cadence", 3),
        target.value
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

const mapPace = (
  value: ValueShape,
  paceZones?: PaceZoneTable
): GarminTargetInfo => {
  const tt = buildTargetType(TargetTypeId.PACE_ZONE, "pace.zone", 6);
  if (value.unit === "zone") {
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
      targetType: tt,
      targetValueOne: entry.minMps,
      targetValueTwo: entry.maxMps,
      zoneNumber: null,
    };
  }
  return mapRangeOrValue(tt, value);
};

const mapZoneOrRange = (tt: TT, value: ValueShape): GarminTargetInfo => {
  if (value.unit === "zone") {
    return {
      targetType: tt,
      targetValueOne: null,
      targetValueTwo: null,
      zoneNumber: value.value ?? null,
    };
  }
  return mapRangeOrValue(tt, value);
};

const mapRangeOrValue = (tt: TT, value: ValueShape): GarminTargetInfo => {
  if (value.unit === "range") {
    return {
      targetType: tt,
      targetValueOne: value.min ?? null,
      targetValueTwo: value.max ?? null,
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
