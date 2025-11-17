import type { Target } from "../../../domain/schemas/target";
import {
  targetTypeSchema,
  type TargetType,
} from "../../../domain/schemas/target";
import type { Logger } from "../../../ports/logger";
import { tcxTargetTypeSchema } from "../schemas/tcx-target";

export const mapTargetType = (
  tcxTargetType: string | undefined
): TargetType => {
  if (tcxTargetType === tcxTargetTypeSchema.enum.HeartRate)
    return targetTypeSchema.enum.heart_rate;
  if (tcxTargetType === tcxTargetTypeSchema.enum.Speed)
    return targetTypeSchema.enum.pace;
  if (tcxTargetType === tcxTargetTypeSchema.enum.Cadence)
    return targetTypeSchema.enum.cadence;
  if (tcxTargetType === tcxTargetTypeSchema.enum.None)
    return targetTypeSchema.enum.open;
  return targetTypeSchema.enum.open;
};

const convertHeartRateTarget = (
  heartRateZone: Record<string, unknown> | undefined
): Target | null => {
  if (!heartRateZone) return null;

  const zoneType = heartRateZone["@_xsi:type"] as string | undefined;

  if (zoneType === "PredefinedHeartRateZone_t") {
    const zoneNumber = heartRateZone.Number as number | undefined;
    if (typeof zoneNumber === "number") {
      return {
        type: "heart_rate",
        value: { unit: "zone", value: zoneNumber },
      };
    }
  }

  if (zoneType === "CustomHeartRateZone_t") {
    const low = heartRateZone.Low as number | undefined;
    const high = heartRateZone.High as number | undefined;
    if (typeof low === "number" && typeof high === "number") {
      return {
        type: "heart_rate",
        value: { unit: "range", min: low, max: high },
      };
    }
  }

  return null;
};

export const convertTcxTarget = (
  tcxTarget: Record<string, unknown> | undefined,
  logger: Logger
): Target | null => {
  if (!tcxTarget) {
    return { type: "open" };
  }

  const targetType = tcxTarget["@_xsi:type"] as string | undefined;

  if (targetType === "None_t") {
    return { type: "open" };
  }

  if (targetType === "HeartRate_t") {
    const heartRateZone = tcxTarget.HeartRateZone as
      | Record<string, unknown>
      | undefined;
    const result = convertHeartRateTarget(heartRateZone);
    if (result) return result;
  }

  logger.warn("Unsupported target type", { targetType });
  return { type: "open" };
};

// KRD → TCX mappers

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

export const mapHeartRateTargetToTcx = (
  target: Target
): Record<string, unknown> => {
  if (target.type !== "heart_rate") {
    return { "@_xsi:type": "None_t" };
  }

  const value = target.value;

  if (value.unit === "zone") {
    return {
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "PredefinedHeartRateZone_t",
        Number: value.value,
      },
    };
  }

  if (value.unit === "range") {
    return {
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "CustomHeartRateZone_t",
        Low: value.min,
        High: value.max,
      },
    };
  }

  if (value.unit === "bpm") {
    return {
      "@_xsi:type": "HeartRate_t",
      HeartRateZone: {
        "@_xsi:type": "CustomHeartRateZone_t",
        Low: value.value,
        High: value.value,
      },
    };
  }

  return { "@_xsi:type": "None_t" };
};

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
