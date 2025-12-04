import { targetTypeSchema, type Target } from "../../../domain/schemas/target";
import { targetUnitSchema } from "../../../domain/schemas/target-values";
import type { FitTargetData } from "./target.types";

export const convertCadenceTarget = (data: FitTargetData): Target => {
  const rangeTarget = buildCadenceRangeTarget(data);
  if (rangeTarget) return rangeTarget;

  const zoneTarget = buildCadenceZoneTarget(data);
  if (zoneTarget) return zoneTarget;

  const valueTarget = buildCadenceValueTarget(data);
  if (valueTarget) return valueTarget;

  return { type: targetTypeSchema.enum.open };
};

const buildCadenceRangeTarget = (data: FitTargetData): Target | null => {
  if (
    data.customTargetCadenceLow !== undefined &&
    data.customTargetCadenceHigh !== undefined
  ) {
    return {
      type: targetTypeSchema.enum.cadence,
      value: {
        unit: targetUnitSchema.enum.range,
        min: data.customTargetCadenceLow,
        max: data.customTargetCadenceHigh,
      },
    };
  }

  if (
    data.customTargetValueLow !== undefined &&
    data.customTargetValueHigh !== undefined
  ) {
    return {
      type: targetTypeSchema.enum.cadence,
      value: {
        unit: targetUnitSchema.enum.range,
        min: data.customTargetValueLow,
        max: data.customTargetValueHigh,
      },
    };
  }

  return null;
};

const buildCadenceZoneTarget = (data: FitTargetData): Target | null => {
  if (data.targetCadenceZone !== undefined) {
    return {
      type: targetTypeSchema.enum.cadence,
      value: {
        unit: targetUnitSchema.enum.rpm,
        value: data.targetCadenceZone,
      },
    };
  }
  return null;
};

const buildCadenceValueTarget = (data: FitTargetData): Target | null => {
  if (data.targetValue !== undefined) {
    return {
      type: targetTypeSchema.enum.cadence,
      value: {
        unit: targetUnitSchema.enum.rpm,
        value: data.targetValue,
      },
    };
  }
  return null;
};
