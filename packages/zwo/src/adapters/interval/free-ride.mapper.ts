import type { Logger, WorkoutStep } from "@kaiord/core";
import { targetTypeSchema } from "@kaiord/core";

import type { ZwiftDurationData } from "../duration/duration.mapper";
import { convertOriginalZwiftDuration } from "../duration/original-duration.converter";
import type { ZwiftTextEvent } from "./index";
import { extractTextEvents } from "./index";
import { restoreIntensity } from "./intensity-restoration";

export type ZwiftFreeRideData = ZwiftDurationData & {
  Cadence?: number;
  FlatRoad?: number;
  "@_FlatRoad"?: number;
  stepIndex: number;
  textevent?: ZwiftTextEvent | Array<ZwiftTextEvent>;
  // kaiord:* restore KRD fields Zwift cannot express, keeping the round-trip
  // lossless even though native Zwift readers ignore them.
  "kaiord:name"?: string;
  "kaiord:intensity"?: string;
};

/**
 * Map Zwift FreeRide interval to KRD step with open target
 * FreeRide intervals allow the user to ride at their own pace
 */
export const mapFreeRideToKrd = (
  data: ZwiftFreeRideData,
  logger?: Logger
): WorkoutStep => {
  const duration = convertOriginalZwiftDuration(data, logger);

  const textEventData = extractTextEvents(data.textevent);

  const step: WorkoutStep = {
    stepIndex: data.stepIndex,
    durationType: duration.type,
    duration,
    targetType: targetTypeSchema.enum.open,
    target: { type: targetTypeSchema.enum.open },
    intensity: restoreIntensity(data["kaiord:intensity"], logger),
    ...textEventData,
  };

  if (data["kaiord:name"]) {
    step.name = data["kaiord:name"];
  }

  // Store FlatRoad attribute in extensions for round-trip preservation
  const flatRoad = data["@_FlatRoad"] ?? data.FlatRoad;
  if (flatRoad !== undefined) {
    step.extensions = {
      ...step.extensions,
      zwift: {
        ...((step.extensions?.zwift as Record<string, unknown>) || {}),
        FlatRoad: flatRoad,
      },
    };
  }

  return step;
};
