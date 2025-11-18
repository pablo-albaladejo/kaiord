import type { Intensity } from "../../../domain/schemas/intensity";
import type { Target } from "../../../domain/schemas/target";
import { targetTypeSchema } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { ZwiftDurationData } from "../duration/duration.mapper";
import { convertZwiftPowerRange } from "../target/target.converter";
import {
  restoreHeartRateTarget,
  restorePowerTarget,
} from "./target-restoration";

export type ZwiftRampData = {
  Duration?: number;
  durationType?: "time" | "distance";
  PowerLow?: number;
  PowerHigh?: number;
  Cadence?: number;
  stepIndex: number;
  textevent?: unknown;
  "kaiord:name"?: string;
  "kaiord:intensity"?: string;
  "kaiord:equipment"?: string;
  "kaiord:originalDurationType"?: string;
  "kaiord:originalDurationMeters"?: number;
  "kaiord:originalDurationBpm"?: number;
  "kaiord:originalDurationWatts"?: number;
  "kaiord:originalWattsLow"?: number;
  "kaiord:originalWattsHigh"?: number;
  "kaiord:assumedFtp"?: number;
  "kaiord:hrTargetLow"?: number;
  "kaiord:hrTargetHigh"?: number;
  "kaiord:hrTargetBpm"?: number;
  "kaiord:hrTargetZone"?: number;
  "kaiord:hrTargetPercentMax"?: number;
  "kaiord:powerUnit"?: "watts" | "percent_ftp" | "zone";
  "kaiord:powerZone"?: number;
};

export const buildRampDurationData = (
  data: ZwiftRampData
): ZwiftDurationData => ({
  Duration: data.Duration,
  durationType: data.durationType,
  "kaiord:originalDurationType": data["kaiord:originalDurationType"],
  "kaiord:originalDurationMeters": data["kaiord:originalDurationMeters"],
  "kaiord:originalDurationBpm": data["kaiord:originalDurationBpm"],
  "kaiord:originalDurationWatts": data["kaiord:originalDurationWatts"],
});

export const resolveRampTarget = (data: ZwiftRampData): Target => {
  const powerTarget = restorePowerTarget(
    data,
    data.PowerLow,
    data.PowerHigh,
    convertZwiftPowerRange
  );
  const hrTarget = restoreHeartRateTarget(data);
  return powerTarget || hrTarget || { type: targetTypeSchema.enum.open };
};

export const resolveIntensity = (
  data: ZwiftRampData,
  defaultIntensity: Intensity
): Intensity => {
  return (
    (data["kaiord:intensity"] as Intensity | undefined) || defaultIntensity
  );
};

export const addRampMetadata = (
  step: WorkoutStep,
  data: ZwiftRampData
): void => {
  if (data["kaiord:name"]) step.name = data["kaiord:name"];
  if (data["kaiord:equipment"]) {
    step.equipment = data["kaiord:equipment"] as WorkoutStep["equipment"];
  }
};
