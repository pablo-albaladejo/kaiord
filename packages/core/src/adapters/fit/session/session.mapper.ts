import type { KRDSession } from "../../../domain/schemas/krd/session";
import type { FitSession } from "../schemas/fit-session";
import { mapSubSportToFit, mapSubSportToKrd } from "../sub-sport/sub-sport";

/**
 * Maps FIT SESSION fields to KRD session fields.
 * Thin translation layer - no complex logic.
 */
export const mapFitSessionToKrd = (fit: FitSession): KRDSession => ({
  startTime: new Date(fit.startTime * 1000).toISOString(),
  totalElapsedTime: fit.totalElapsedTime / 1000,
  totalTimerTime:
    fit.totalTimerTime !== undefined ? fit.totalTimerTime / 1000 : undefined,
  totalDistance: fit.totalDistance,
  sport: String(fit.sport),
  subSport: fit.subSport ? mapSubSportToKrd(fit.subSport) : undefined,
  avgHeartRate: fit.avgHeartRate,
  maxHeartRate: fit.maxHeartRate,
  avgCadence: fit.avgCadence,
  maxCadence: fit.maxCadence,
  avgPower: fit.avgPower,
  maxPower: fit.maxPower,
  normalizedPower: fit.normalizedPower,
  trainingStressScore: fit.trainingStressScore,
  intensityFactor: fit.intensityFactor,
  totalCalories: fit.totalCalories,
  totalAscent: fit.totalAscent,
  totalDescent: fit.totalDescent,
  avgSpeed: fit.enhancedAvgSpeed ?? fit.avgSpeed,
  maxSpeed: fit.enhancedMaxSpeed ?? fit.maxSpeed,
});

/**
 * Maps KRD session fields to FIT SESSION fields.
 * Thin translation layer - no complex logic.
 */
export const mapKrdSessionToFit = (krd: KRDSession): Partial<FitSession> => {
  const startTimeSeconds = Math.floor(new Date(krd.startTime).getTime() / 1000);
  const elapsedTimeMs = krd.totalElapsedTime * 1000;
  // Preserve zero totalTimerTime, default to elapsed time if undefined
  const timerTimeMs =
    krd.totalTimerTime !== undefined
      ? krd.totalTimerTime * 1000
      : elapsedTimeMs;

  return {
    timestamp: startTimeSeconds + Math.floor(krd.totalElapsedTime),
    startTime: startTimeSeconds,
    totalElapsedTime: elapsedTimeMs,
    totalTimerTime: timerTimeMs,
    totalDistance: krd.totalDistance,
    sport: krd.sport as FitSession["sport"],
    subSport: krd.subSport ? mapSubSportToFit(krd.subSport) : undefined,
    avgHeartRate: krd.avgHeartRate,
    maxHeartRate: krd.maxHeartRate,
    avgCadence: krd.avgCadence,
    maxCadence: krd.maxCadence,
    avgPower: krd.avgPower,
    maxPower: krd.maxPower,
    normalizedPower: krd.normalizedPower,
    trainingStressScore: krd.trainingStressScore,
    intensityFactor: krd.intensityFactor,
    totalCalories: krd.totalCalories,
    totalAscent: krd.totalAscent,
    totalDescent: krd.totalDescent,
    avgSpeed: krd.avgSpeed,
    maxSpeed: krd.maxSpeed,
  };
};
