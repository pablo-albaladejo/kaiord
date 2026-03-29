import { semicirclesToDegrees } from "../shared/coordinate.converter";
import type { FitRecord } from "../schemas/fit-record";
import type { KRDRecord } from "@kaiord/core";

const mapFitPosition = (
  fit: FitRecord
): { lat: number; lon: number } | undefined => {
  if (fit.positionLat !== undefined && fit.positionLong !== undefined) {
    return {
      lat: semicirclesToDegrees(fit.positionLat),
      lon: semicirclesToDegrees(fit.positionLong),
    };
  }
  return undefined;
};

const mapFitAltitudeAndSpeed = (fit: FitRecord, record: KRDRecord): void => {
  if (fit.enhancedAltitude !== undefined) {
    record.altitude = fit.enhancedAltitude;
  } else if (fit.altitude !== undefined) {
    record.altitude = fit.altitude;
  }
  if (fit.enhancedSpeed !== undefined) {
    record.speed = fit.enhancedSpeed;
  } else if (fit.speed !== undefined) {
    record.speed = fit.speed;
  }
};

const mapFitCoreFields = (fit: FitRecord, record: KRDRecord): void => {
  if (fit.distance !== undefined) record.distance = fit.distance;
  if (fit.heartRate !== undefined) record.heartRate = fit.heartRate;
  if (fit.power !== undefined) record.power = fit.power;
  if (fit.temperature !== undefined) record.temperature = fit.temperature;
  if (fit.cadence !== undefined) {
    record.cadence = fit.cadence + (fit.fractionalCadence ?? 0);
  }
};

const mapFitRunningDynamics = (fit: FitRecord, record: KRDRecord): void => {
  if (fit.verticalOscillation !== undefined) {
    record.verticalOscillation = fit.verticalOscillation;
  }
  if (fit.stanceTime !== undefined) record.stanceTime = fit.stanceTime;
  if (fit.stepLength !== undefined) record.stepLength = fit.stepLength;
};

/**
 * Maps FIT RECORD fields to KRD record fields.
 * Thin translation layer - no complex logic.
 */
export const mapFitRecordToKrd = (fit: FitRecord): KRDRecord => {
  const record: KRDRecord = {
    timestamp: new Date(fit.timestamp * 1000).toISOString(),
  };

  const position = mapFitPosition(fit);
  if (position) record.position = position;
  mapFitAltitudeAndSpeed(fit, record);
  mapFitCoreFields(fit, record);
  mapFitRunningDynamics(fit, record);

  return record;
};
