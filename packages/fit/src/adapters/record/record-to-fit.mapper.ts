import type { KRDRecord } from "@kaiord/core";

import type { FitRecord } from "../schemas/fit-record";
import { degreesToSemicircles } from "../shared/coordinate.converter";

const mapKrdCadenceToFit = (krd: KRDRecord, fit: Partial<FitRecord>): void => {
  if (krd.cadence !== undefined) {
    fit.cadence = Math.floor(krd.cadence);
    const fractional = krd.cadence - Math.floor(krd.cadence);
    if (fractional > 0) {
      fit.fractionalCadence = fractional;
    }
  }
};

const mapKrdRunningDynamics = (
  krd: KRDRecord,
  fit: Partial<FitRecord>
): void => {
  if (krd.verticalOscillation !== undefined) {
    fit.verticalOscillation = krd.verticalOscillation;
  }
  if (krd.stanceTime !== undefined) fit.stanceTime = krd.stanceTime;
  if (krd.stepLength !== undefined) fit.stepLength = krd.stepLength;
};

/**
 * Maps KRD record fields to FIT RECORD fields.
 * Thin translation layer - no complex logic.
 */
export const mapKrdRecordToFit = (krd: KRDRecord): Partial<FitRecord> => {
  const fit: Partial<FitRecord> = {
    timestamp: Math.floor(new Date(krd.timestamp).getTime() / 1000),
  };

  if (krd.position) {
    fit.positionLat = degreesToSemicircles(krd.position.lat);
    fit.positionLong = degreesToSemicircles(krd.position.lon);
  }

  if (krd.altitude !== undefined) fit.altitude = krd.altitude;
  if (krd.speed !== undefined) fit.speed = krd.speed;
  if (krd.distance !== undefined) fit.distance = krd.distance;
  if (krd.heartRate !== undefined) fit.heartRate = krd.heartRate;
  if (krd.power !== undefined) fit.power = krd.power;
  if (krd.temperature !== undefined) fit.temperature = krd.temperature;

  mapKrdCadenceToFit(krd, fit);
  mapKrdRunningDynamics(krd, fit);

  return fit;
};
