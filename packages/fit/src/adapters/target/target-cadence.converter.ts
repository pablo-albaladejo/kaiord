import { type Target, targetTypeSchema } from "@kaiord/core";
import { targetUnitSchema } from "@kaiord/core";

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

// The writer encodes a single rpm value as a custom range with
// low === high (FIT has no single-value custom field), so an equal
// range reads back as the single value it was written from.
const buildRange = (min: number, max: number): Target => ({
  type: targetTypeSchema.enum.cadence,
  value:
    min === max
      ? { unit: targetUnitSchema.enum.rpm, value: min }
      : { unit: targetUnitSchema.enum.range, min, max },
});

const buildCadenceRangeTarget = (data: FitTargetData): Target | null => {
  if (
    data.customTargetCadenceLow !== undefined &&
    data.customTargetCadenceHigh !== undefined
  ) {
    return buildRange(
      data.customTargetCadenceLow,
      data.customTargetCadenceHigh
    );
  }

  if (
    data.customTargetValueLow !== undefined &&
    data.customTargetValueHigh !== undefined
  ) {
    return buildRange(data.customTargetValueLow, data.customTargetValueHigh);
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
