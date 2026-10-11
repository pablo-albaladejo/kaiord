import type { KRDLap } from "@kaiord/core";
import { FIT_TO_SWIM_STROKE, swimStrokeSchema } from "@kaiord/core";

import type { FitLap } from "../schemas/fit-lap";
import { fitTimestampToIso } from "../shared/fit-timestamp";
import { mapSportToKrd } from "../sport/sport.mapper";
import { mapSubSportToKrd } from "../sub-sport/sub-sport";
import { mapFitLapTriggerToKrd } from "./lap-trigger.mapper";

const mapFitSwimStrokeToKrd = (
  value: FitLap["swimStroke"]
): KRDLap["swimStroke"] => {
  if (typeof value === "number") return FIT_TO_SWIM_STROKE[value];
  const parsed = swimStrokeSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

/**
 * Maps FIT LAP fields to KRD lap fields.
 * Thin translation layer - no complex logic.
 */
export const mapFitLapToKrd = (fit: FitLap): KRDLap => ({
  // Timing - the SDK Decoder already applies the profile scale (seconds)
  startTime: fitTimestampToIso(fit.startTime),
  totalElapsedTime: fit.totalElapsedTime,
  totalTimerTime: fit.totalTimerTime,

  // Distance
  totalDistance: fit.totalDistance,

  // Heart rate
  avgHeartRate: fit.avgHeartRate,
  maxHeartRate: fit.maxHeartRate,

  // Cadence
  avgCadence: fit.avgCadence,
  maxCadence: fit.maxCadence,

  // Power
  avgPower: fit.avgPower,
  maxPower: fit.maxPower,
  normalizedPower: fit.normalizedPower,

  // Speed - prefer enhanced values
  avgSpeed: fit.enhancedAvgSpeed ?? fit.avgSpeed,
  maxSpeed: fit.enhancedMaxSpeed ?? fit.maxSpeed,

  // Elevation
  totalAscent: fit.totalAscent,
  totalDescent: fit.totalDescent,

  // Calories
  totalCalories: fit.totalCalories,

  // Classification
  trigger: fit.lapTrigger ? mapFitLapTriggerToKrd(fit.lapTrigger) : undefined,
  sport: fit.sport ? mapSportToKrd(fit.sport) : undefined,
  subSport: fit.subSport ? mapSubSportToKrd(fit.subSport) : undefined,

  // Workout reference
  workoutStepIndex: fit.wktStepIndex,

  // Swimming
  numLengths: fit.numLengths,
  swimStroke: mapFitSwimStrokeToKrd(fit.swimStroke),
});
