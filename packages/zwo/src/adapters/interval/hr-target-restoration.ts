import { targetTypeSchema, type Target } from "@kaiord/core";

type KaiordHrAttributes = {
  "kaiord:hrTargetLow"?: number;
  "kaiord:hrTargetHigh"?: number;
  "kaiord:hrTargetBpm"?: number;
  "kaiord:hrTargetZone"?: number;
  "kaiord:hrTargetPercentMax"?: number;
};

const restoreHrRange = (data: KaiordHrAttributes): Target | null => {
  if (
    data["kaiord:hrTargetLow"] !== undefined &&
    data["kaiord:hrTargetHigh"] !== undefined
  ) {
    return {
      type: targetTypeSchema.enum.heart_rate,
      value: {
        unit: "range",
        min: data["kaiord:hrTargetLow"],
        max: data["kaiord:hrTargetHigh"],
      },
    };
  }
  return null;
};

const restoreHrBpm = (data: KaiordHrAttributes): Target | null => {
  if (data["kaiord:hrTargetBpm"] !== undefined) {
    return {
      type: targetTypeSchema.enum.heart_rate,
      value: {
        unit: "bpm",
        value: data["kaiord:hrTargetBpm"],
      },
    };
  }
  return null;
};

const restoreHrZone = (data: KaiordHrAttributes): Target | null => {
  if (data["kaiord:hrTargetZone"] !== undefined) {
    return {
      type: targetTypeSchema.enum.heart_rate,
      value: {
        unit: "zone",
        value: data["kaiord:hrTargetZone"],
      },
    };
  }
  return null;
};

const restoreHrPercentMax = (data: KaiordHrAttributes): Target | null => {
  if (data["kaiord:hrTargetPercentMax"] !== undefined) {
    return {
      type: targetTypeSchema.enum.heart_rate,
      value: {
        unit: "percent_max",
        value: data["kaiord:hrTargetPercentMax"],
      },
    };
  }
  return null;
};

export const restoreHeartRateTarget = (
  data: KaiordHrAttributes
): Target | null => {
  return (
    restoreHrRange(data) ||
    restoreHrBpm(data) ||
    restoreHrZone(data) ||
    restoreHrPercentMax(data) ||
    null
  );
};
