import {
  targetTypeSchema,
  targetUnitSchema,
  type Target,
} from "../../../domain/schemas/target";
import type { FitTargetData } from "./target.types";

export const convertPaceTarget = (data: FitTargetData): Target => {
  const rangeTarget = buildPaceRangeTarget(data);
  if (rangeTarget) return rangeTarget;

  const zoneTarget = buildPaceZoneTarget(data);
  if (zoneTarget) return zoneTarget;

  const valueTarget = buildPaceValueTarget(data);
  if (valueTarget) return valueTarget;

  return { type: targetTypeSchema.enum.open };
};

const buildPaceRangeTarget = (data: FitTargetData): Target | null => {
  if (
    data.customTargetSpeedLow !== undefined &&
    data.customTargetSpeedHigh !== undefined
  ) {
    return {
      type: targetTypeSchema.enum.pace,
      value: {
        unit: targetUnitSchema.enum.range,
        min: data.customTargetSpeedLow,
        max: data.customTargetSpeedHigh,
      },
    };
  }

  if (
    data.customTargetValueLow !== undefined &&
    data.customTargetValueHigh !== undefined
  ) {
    return {
      type: targetTypeSchema.enum.pace,
      value: {
        unit: targetUnitSchema.enum.range,
        min: data.customTargetValueLow,
        max: data.customTargetValueHigh,
      },
    };
  }

  return null;
};

const buildPaceZoneTarget = (data: FitTargetData): Target | null => {
  if (data.targetSpeedZone !== undefined) {
    return {
      type: targetTypeSchema.enum.pace,
      value: {
        unit: targetUnitSchema.enum.zone,
        value: data.targetSpeedZone,
      },
    };
  }
  return null;
};

const buildPaceValueTarget = (data: FitTargetData): Target | null => {
  if (data.targetValue !== undefined) {
    return {
      type: targetTypeSchema.enum.pace,
      value: {
        unit: targetUnitSchema.enum.mps,
        value: data.targetValue,
      },
    };
  }
  return null;
};
