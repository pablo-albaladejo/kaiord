import { targetTypeSchema, type Target } from "../../../domain/schemas/target";

type KaiordTargetAttributes = {
  "kaiord:powerUnit"?: "watts" | "percent_ftp" | "zone";
  "kaiord:originalWattsLow"?: number;
  "kaiord:originalWattsHigh"?: number;
  "kaiord:powerZone"?: number;
  "kaiord:hrTargetLow"?: number;
  "kaiord:hrTargetHigh"?: number;
  "kaiord:hrTargetBpm"?: number;
  "kaiord:hrTargetZone"?: number;
  "kaiord:hrTargetPercentMax"?: number;
};

const restoreWattsTarget = (data: KaiordTargetAttributes): Target | null => {
  if (
    data["kaiord:powerUnit"] === "watts" &&
    data["kaiord:originalWattsLow"] !== undefined &&
    data["kaiord:originalWattsHigh"] !== undefined
  ) {
    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: "range",
        min: data["kaiord:originalWattsLow"],
        max: data["kaiord:originalWattsHigh"],
      },
    };
  }
  return null;
};

const restoreZoneTarget = (data: KaiordTargetAttributes): Target | null => {
  if (
    data["kaiord:powerUnit"] === "zone" &&
    data["kaiord:powerZone"] !== undefined
  ) {
    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: "zone",
        value: data["kaiord:powerZone"],
      },
    };
  }
  return null;
};

export const restorePowerTarget = (
  data: KaiordTargetAttributes,
  powerLow?: number,
  powerHigh?: number,
  convertZwiftPowerRange?: (low: number, high: number) => Target
): Target | null => {
  const wattsTarget = restoreWattsTarget(data);
  if (wattsTarget) return wattsTarget;

  const zoneTarget = restoreZoneTarget(data);
  if (zoneTarget) return zoneTarget;

  if (
    powerLow !== undefined &&
    powerHigh !== undefined &&
    convertZwiftPowerRange
  ) {
    return convertZwiftPowerRange(powerLow, powerHigh);
  }

  return null;
};

export { restoreHeartRateTarget } from "./hr-target-restoration";
