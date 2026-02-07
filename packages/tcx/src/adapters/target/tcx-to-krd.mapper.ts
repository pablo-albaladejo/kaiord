import type { Target } from "@kaiord/core";
import { targetTypeSchema, type TargetType } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
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
