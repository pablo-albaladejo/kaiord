import { FIT_TO_SWIM_STROKE } from "@kaiord/core";
import { mapFitLapTriggerToKrd } from "./lap-trigger.mapper";
import { mapSubSportToKrd } from "../sub-sport/sub-sport";
import type { FitLap } from "../schemas/fit-lap";
import type { KRDLap } from "@kaiord/core";

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
