import type { KRDLap } from "@kaiord/core";
import { SWIM_STROKE_TO_FIT } from "@kaiord/core";

import type { FitLap } from "../schemas/fit-lap";
import { mapSportToFit } from "../sport/sport.mapper";
import { mapSubSportToFit } from "../sub-sport/sub-sport";
import { mapKrdLapTriggerToFit } from "./lap-trigger.mapper";

/**
 * Maps KRD lap fields to FIT LAP fields.
 * Thin translation layer - no complex logic.
 */
export const mapKrdLapToFit = (krd: KRDLap): Partial<FitLap> => {
  const startTimeSeconds = Math.floor(new Date(krd.startTime).getTime() / 1000);
  // Durations stay in seconds: the SDK Encoder applies the profile scale.
  // Preserve zero totalTimerTime, default to elapsed time if undefined
  const timerTime = krd.totalTimerTime ?? krd.totalElapsedTime;

  return {
    // Timing
    timestamp: startTimeSeconds + Math.floor(krd.totalElapsedTime),
    startTime: startTimeSeconds,
    totalElapsedTime: krd.totalElapsedTime,
    totalTimerTime: timerTime,

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
    sport: krd.sport ? mapSportToFit(krd.sport) : undefined,
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
