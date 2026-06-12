import type { Target } from "@kaiord/core";

import {
  buildPaceTargetType,
  resolvePaceZone,
} from "../mappers/target-pace.mapper";
import { TargetTypeId } from "../schemas/common";
import type {
  GarminTargetInfo,
  PaceZoneTable,
  TargetMapperOptions,
} from "./target-types";
import { buildTargetType } from "./target-types";

type Val = { unit: string; value?: number; min?: number; max?: number };
type TT = GarminTargetInfo["targetType"];

export const convertKrdTargetToGarmin = (
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

/**
 * Garmin wire convention for range targets: speed/power targets are ordered
 * fastest-bound-first (the higher numeric value in `targetValueOne`), while
 * heart-rate and cadence targets are ordered ascending (lower bound first).
 * `fasterFirst` selects between the two orderings — `true` for power and pace,
 * `false` for heart rate and cadence (see the call sites in
 * `convertKrdTargetToGarmin`).
 */
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
