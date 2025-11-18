import { intensitySchema } from "../../../domain/schemas/intensity";
import { targetTypeSchema, type Target } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { ZwiftDurationData } from "../duration/duration.mapper";
import { mapZwiftDuration } from "../duration/duration.mapper";
import { convertZwiftPowerTarget } from "../target/target.converter";
import { extractTextEvents, type ZwiftTextEvent } from "./index";
import { restoreHeartRateTarget } from "./target-restoration";

export type ZwiftSteadyStateData = {
  Duration?: number;
  durationType?: "time" | "distance";
  Power?: number;
  Cadence?: number;
  stepIndex: number;
  textevent?: ZwiftTextEvent | Array<ZwiftTextEvent>;
  // Kaiord round-trip attributes
  "kaiord:name"?: string;
  "kaiord:intensity"?: string;
  "kaiord:equipment"?: string;
  "kaiord:originalDurationType"?: string;
  "kaiord:originalDurationMeters"?: number;
  "kaiord:originalDurationBpm"?: number;
  "kaiord:originalDurationWatts"?: number;
  "kaiord:hrTargetLow"?: number;
  "kaiord:hrTargetHigh"?: number;
  "kaiord:hrTargetBpm"?: number;
  "kaiord:hrTargetZone"?: number;
  "kaiord:hrTargetPercentMax"?: number;
  "kaiord:powerUnit"?: "watts" | "percent_ftp" | "zone";
  "kaiord:originalWatts"?: number;
  "kaiord:powerZone"?: number;
  "kaiord:assumedFtp"?: number;
};

const restoreSteadyStateTarget = (data: ZwiftSteadyStateData): Target => {
  if (data["kaiord:powerUnit"] === "watts" && data["kaiord:originalWatts"]) {
    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: "watts",
        value: data["kaiord:originalWatts"],
      },
    };
  }

  if (data["kaiord:powerUnit"] === "zone" && data["kaiord:powerZone"]) {
    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: "zone",
        value: data["kaiord:powerZone"],
      },
    };
  }

  if (data.Power !== undefined) {
    return convertZwiftPowerTarget(data.Power);
  }

  const hrTarget = restoreHeartRateTarget(data);
  return hrTarget || { type: targetTypeSchema.enum.open };
};

export const mapSteadyStateToKrd = (
  data: ZwiftSteadyStateData
): WorkoutStep => {
  const durationData: ZwiftDurationData = {
    Duration: data.Duration,
    durationType: data.durationType,
    "kaiord:originalDurationType": data["kaiord:originalDurationType"],
    "kaiord:originalDurationMeters": data["kaiord:originalDurationMeters"],
    "kaiord:originalDurationBpm": data["kaiord:originalDurationBpm"],
    "kaiord:originalDurationWatts": data["kaiord:originalDurationWatts"],
  };

  const duration = mapZwiftDuration(durationData);
  const target = restoreSteadyStateTarget(data);
  const textEventData = extractTextEvents(data.textevent);

  const step: WorkoutStep = {
    stepIndex: data.stepIndex,
    durationType: duration.type,
    duration,
    targetType: target.type,
    target,
    intensity:
      (data["kaiord:intensity"] as
        | "warmup"
        | "active"
        | "cooldown"
        | "rest"
        | undefined) || intensitySchema.enum.active,
    ...textEventData,
  };

  if (data["kaiord:name"]) {
    step.name = data["kaiord:name"];
  }
  if (data["kaiord:equipment"]) {
    step.equipment = data["kaiord:equipment"] as WorkoutStep["equipment"];
  }

  return step;
};
