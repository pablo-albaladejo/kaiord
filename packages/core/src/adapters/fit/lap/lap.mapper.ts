import type { KRDLap } from "../../../domain/schemas/krd/lap";
import {
  FIT_TO_SWIM_STROKE,
  SWIM_STROKE_TO_FIT,
} from "../../../domain/schemas/swim-stroke";
import type { FitLap } from "../schemas/fit-lap";
import { mapSubSportToFit, mapSubSportToKrd } from "../sub-sport/sub-sport";
import {
  mapFitLapTriggerToKrd,
  mapKrdLapTriggerToFit,
} from "./lap-trigger.mapper";

/**
 * Maps FIT LAP fields to KRD lap fields.
 * Thin translation layer - no complex logic.
 */
export const mapFitLapToKrd = (fit: FitLap): KRDLap => ({
  // Timing - convert ms to seconds
  startTime: new Date(fit.startTime * 1000).toISOString(),
  totalElapsedTime: fit.totalElapsedTime / 1000,
  totalTimerTime: fit.totalTimerTime / 1000,

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
  sport: fit.sport,
  subSport: fit.subSport ? mapSubSportToKrd(fit.subSport) : undefined,

  // Workout reference
  workoutStepIndex: fit.wktStepIndex,

  // Swimming
  numLengths: fit.numLengths,
  swimStroke:
    fit.swimStroke !== undefined
      ? FIT_TO_SWIM_STROKE[fit.swimStroke]
      : undefined,
});

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
