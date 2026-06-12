import type { Logger, WorkoutStep } from "@kaiord/core";

import type { ZwiftDurationData } from "../duration/duration.mapper";
import { convertOriginalZwiftDuration } from "../duration/original-duration.converter";
import type { ZwiftTextEvent } from "./index";
import { extractTextEvents } from "./index";
import { restoreIntensity } from "./intensity-restoration";
import { restoreSteadyStateTarget } from "./steady-state-target.helpers";

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

export const convertSteadyStateToKrd = (
  data: ZwiftSteadyStateData,
  logger?: Logger
): WorkoutStep => {
  const durationData: ZwiftDurationData = {
    Duration: data.Duration,
    durationType: data.durationType,
    "kaiord:originalDurationType": data["kaiord:originalDurationType"],
    "kaiord:originalDurationMeters": data["kaiord:originalDurationMeters"],
    "kaiord:originalDurationBpm": data["kaiord:originalDurationBpm"],
    "kaiord:originalDurationWatts": data["kaiord:originalDurationWatts"],
  };

  const duration = convertOriginalZwiftDuration(durationData, logger);
  const target = restoreSteadyStateTarget(data);
  const textEventData = extractTextEvents(data.textevent);

  const step: WorkoutStep = {
    stepIndex: data.stepIndex,
    durationType: duration.type,
    duration,
    targetType: target.type,
    target,
    intensity: restoreIntensity(data["kaiord:intensity"], logger),
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
