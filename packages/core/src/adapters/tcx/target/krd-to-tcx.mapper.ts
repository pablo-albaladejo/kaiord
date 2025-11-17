import type { Target } from "../../../domain/schemas/target";
import {
  targetTypeSchema,
  type TargetType,
} from "../../../domain/schemas/target";
import { tcxTargetTypeSchema } from "../schemas/tcx-target";

export const mapTargetTypeToTcx = (targetType: TargetType): string => {
  if (targetType === targetTypeSchema.enum.heart_rate)
    return tcxTargetTypeSchema.enum.HeartRate;
  if (targetType === targetTypeSchema.enum.pace)
    return tcxTargetTypeSchema.enum.Speed;
  if (targetType === targetTypeSchema.enum.cadence)
    return tcxTargetTypeSchema.enum.Cadence;
  if (targetType === targetTypeSchema.enum.open)
    return tcxTargetTypeSchema.enum.None;
  return tcxTargetTypeSchema.enum.None;
};

export { mapHeartRateTargetToTcx } from "./heart-rate.mapper";

export const mapPaceTargetToTcx = (target: Target): Record<string, unknown> => {
  if (target.type !== "pace") {
    return { "@_xsi:type": "None_t" };
  }

  const value = target.value;

  if (value.unit === "mps") {
    return {
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: value.value,
        HighInMetersPerSecond: value.value,
      },
    };
  }

  if (value.unit === "range") {
    return {
      "@_xsi:type": "Speed_t",
      SpeedZone: {
        "@_xsi:type": "CustomSpeedZone_t",
        LowInMetersPerSecond: value.min,
        HighInMetersPerSecond: value.max,
      },
    };
  }

  return { "@_xsi:type": "None_t" };
};

export const mapCadenceTargetToTcx = (
  target: Target,
  sport?: string
): Record<string, unknown> => {
  if (target.type !== "cadence") {
    return { "@_xsi:type": "None_t" };
  }

  const value = target.value;
  const isRunning = sport === "running" || sport === "Running";

  if (value.unit === "rpm") {
    const cadenceValue = isRunning ? value.value * 2 : value.value;
    return {
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: cadenceValue,
        High: cadenceValue,
      },
    };
  }

  if (value.unit === "range") {
    const minCadence = isRunning ? value.min * 2 : value.min;
    const maxCadence = isRunning ? value.max * 2 : value.max;
    return {
      "@_xsi:type": "Cadence_t",
      CadenceZone: {
        "@_xsi:type": "CustomCadenceZone_t",
        Low: minCadence,
        High: maxCadence,
      },
    };
  }

  return { "@_xsi:type": "None_t" };
};

export const mapOpenTargetToTcx = (): Record<string, unknown> => {
  return { "@_xsi:type": "None_t" };
};
