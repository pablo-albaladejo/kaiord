import { type Logger, type Target, targetTypeSchema } from "@kaiord/core";
import { targetUnitSchema } from "@kaiord/core";

import { convertPowerValue, interpretWorkoutPower } from "./power-helpers";
import type { FitTargetData } from "./target.types";

// FIT defines 7 power zones. If the zone field is out of range,
// reinterpret it as an absolute value (FIT overloads the zone field).
const POWER_ZONE_MAX = 7;

export const convertPowerTarget = (
  data: FitTargetData,
  logger?: Logger
): Target => {
  const rangeTarget = buildPowerRangeTarget(data, logger);
  if (rangeTarget) return rangeTarget;

  const zoneTarget = buildPowerZoneTarget(data);
  if (zoneTarget) return zoneTarget;

  if (data.targetValue !== undefined) {
    const powerValue = convertPowerValue(data.targetValue);
    if (powerValue) {
      return {
        type: targetTypeSchema.enum.power,
        value: powerValue,
      };
    }
  }

  return { type: targetTypeSchema.enum.open };
};

// A range whose bounds use different encodings (e.g. 90 %FTP to 250 W) has
// no single-unit KRD representation, so it is rejected rather than coerced.
const buildRange = (
  low: number,
  high: number,
  logger?: Logger
): Target | null => {
  const min = interpretWorkoutPower(low);
  const max = interpretWorkoutPower(high);
  if (min.type !== max.type) {
    logger?.warn("Power range mixes %FTP and watts bounds; range dropped", {
      low,
      high,
    });
    return null;
  }
  const percent = min.type === "percentage";
  return {
    type: targetTypeSchema.enum.power,
    value: {
      unit: targetUnitSchema.enum.range,
      // KRD ranges are min <= max; a FIT range stored high-to-low is sorted.
      min: Math.min(min.value, max.value),
      max: Math.max(min.value, max.value),
      ...(percent && { basis: targetUnitSchema.enum.percent_ftp }),
    },
  };
};

const buildPowerRangeTarget = (
  data: FitTargetData,
  logger?: Logger
): Target | null => {
  if (
    data.customTargetPowerLow !== undefined &&
    data.customTargetPowerHigh !== undefined
  ) {
    return buildRange(
      data.customTargetPowerLow,
      data.customTargetPowerHigh,
      logger
    );
  }

  if (
    data.customTargetValueLow !== undefined &&
    data.customTargetValueHigh !== undefined
  ) {
    return buildRange(
      data.customTargetValueLow,
      data.customTargetValueHigh,
      logger
    );
  }

  return null;
};

const buildPowerZoneTarget = (data: FitTargetData): Target | null => {
  if (data.targetPowerZone !== undefined) {
    if (data.targetPowerZone >= 1 && data.targetPowerZone <= POWER_ZONE_MAX) {
      return {
        type: targetTypeSchema.enum.power,
        value: {
          unit: targetUnitSchema.enum.zone,
          value: data.targetPowerZone,
        },
      };
    }
    const powerValue = convertPowerValue(data.targetPowerZone);
    if (powerValue) {
      return { type: targetTypeSchema.enum.power, value: powerValue };
    }
  }
  return null;
};
