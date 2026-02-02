import type { KRDSession } from "../../../domain/schemas/krd/session";
import type { FitSession } from "../schemas/fit-session";

/**
 * Maps FIT SESSION fields to KRD session fields.
 * Thin translation layer - no complex logic.
 */
export const mapFitSessionToKrd = (fit: FitSession): KRDSession => ({
  startTime: new Date(fit.startTime * 1000).toISOString(),
  totalElapsedTime: fit.totalElapsedTime / 1000,
  totalTimerTime: fit.totalTimerTime ? fit.totalTimerTime / 1000 : undefined,
  totalDistance: fit.totalDistance,
  sport: String(fit.sport),
  subSport: fit.subSport ? String(fit.subSport) : undefined,
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
export const mapKrdSessionToFit = (krd: KRDSession): Partial<FitSession> => ({
  startTime: Math.floor(new Date(krd.startTime).getTime() / 1000),
  totalElapsedTime: krd.totalElapsedTime * 1000,
  totalTimerTime: krd.totalTimerTime ? krd.totalTimerTime * 1000 : undefined,
  totalDistance: krd.totalDistance,
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
});
