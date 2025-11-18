import { intensitySchema } from "../../../domain/schemas/intensity";
import { targetTypeSchema } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { ZwiftDurationData } from "../duration/duration.mapper";
import { mapZwiftDuration } from "../duration/duration.mapper";
import { extractTextEvents, type ZwiftTextEvent } from "./index";

export type ZwiftFreeRideData = {
  Duration?: number;
  durationType?: "time" | "distance";
  Cadence?: number;
  FlatRoad?: number;
  "@_FlatRoad"?: number;
  stepIndex: number;
  textevent?: ZwiftTextEvent | Array<ZwiftTextEvent>;
};

/**
 * Map Zwift FreeRide interval to KRD step with open target
 * FreeRide intervals allow the user to ride at their own pace
 */
export const mapFreeRideToKrd = (data: ZwiftFreeRideData): WorkoutStep => {
  const durationData: ZwiftDurationData = {
    Duration: data.Duration,
    durationType: data.durationType,
  };

  const duration = mapZwiftDuration(durationData);

  const textEventData = extractTextEvents(data.textevent);

  const step: WorkoutStep = {
    stepIndex: data.stepIndex,
    durationType: duration.type,
    duration,
    targetType: targetTypeSchema.enum.open,
    target: { type: targetTypeSchema.enum.open },
    intensity: intensitySchema.enum.active,
    ...textEventData,
  };

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
