import { SWIM_STROKE_TO_FIT } from "@kaiord/core";
import { mapKrdLapTriggerToFit } from "./lap-trigger.mapper";
import { mapSubSportToFit } from "../sub-sport/sub-sport";
import type { FitLap } from "../schemas/fit-lap";
import type { KRDLap } from "@kaiord/core";

/**
 * Maps KRD lap fields to FIT LAP fields.
 * Thin translation layer - no complex logic.
 */
export const mapKrdLapToFit = (krd: KRDLap): Partial<FitLap> => {
  const startTimeSeconds = Math.floor(new Date(krd.startTime).getTime() / 1000);
  const elapsedTimeMs = krd.totalElapsedTime * 1000;
  // Preserve zero totalTimerTime, default to elapsed time if undefined
  const timerTimeMs =
    krd.totalTimerTime !== undefined
      ? krd.totalTimerTime * 1000
      : elapsedTimeMs;

  return {
    // Timing
    timestamp: startTimeSeconds + Math.floor(krd.totalElapsedTime),
    startTime: startTimeSeconds,
    totalElapsedTime: elapsedTimeMs,
    totalTimerTime: timerTimeMs,

    // Distance
    totalDistance: krd.totalDistance,

    // Heart rate
    avgHeartRate: krd.avgHeartRate,
    maxHeartRate: krd.maxHeartRate,

    // Cadence
    avgCadence: krd.avgCadence,
    maxCadence: krd.maxCadence,

    // Power
    avgPower: krd.avgPower,
    maxPower: krd.maxPower,
    normalizedPower: krd.normalizedPower,

    // Speed
    avgSpeed: krd.avgSpeed,
    maxSpeed: krd.maxSpeed,

    // Elevation
    totalAscent: krd.totalAscent,
    totalDescent: krd.totalDescent,

    // Calories
    totalCalories: krd.totalCalories,

    // Classification
    lapTrigger: krd.trigger ? mapKrdLapTriggerToFit(krd.trigger) : undefined,
    sport: krd.sport,
    subSport: krd.subSport ? mapSubSportToFit(krd.subSport) : undefined,

    // Workout reference
    wktStepIndex: krd.workoutStepIndex,

    // Swimming
    numLengths: krd.numLengths,
    swimStroke:
      krd.swimStroke !== undefined
        ? SWIM_STROKE_TO_FIT[krd.swimStroke]
        : undefined,
  };
};
