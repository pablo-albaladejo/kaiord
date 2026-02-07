import type { KRDRecord } from "@kaiord/core";
import type { FitRecord } from "../schemas/fit-record";
import {
  degreesToSemicircles,
  semicirclesToDegrees,
} from "../shared/coordinate.converter";

/**
 * Maps FIT RECORD fields to KRD record fields.
 * Thin translation layer - no complex logic.
 */
export const mapFitRecordToKrd = (fit: FitRecord): KRDRecord => {
  const record: KRDRecord = {
    timestamp: new Date(fit.timestamp * 1000).toISOString(),
  };

  // Position - convert semicircles to degrees
  if (fit.positionLat !== undefined && fit.positionLong !== undefined) {
    record.position = {
      lat: semicirclesToDegrees(fit.positionLat),
      lon: semicirclesToDegrees(fit.positionLong),
    };
  }

  // Altitude - prefer enhanced
  if (fit.enhancedAltitude !== undefined) {
    record.altitude = fit.enhancedAltitude;
  } else if (fit.altitude !== undefined) {
    record.altitude = fit.altitude;
  }

  // Speed - prefer enhanced
  if (fit.enhancedSpeed !== undefined) {
    record.speed = fit.enhancedSpeed;
  } else if (fit.speed !== undefined) {
    record.speed = fit.speed;
  }

  // Direct mappings
  if (fit.distance !== undefined) record.distance = fit.distance;
  if (fit.heartRate !== undefined) record.heartRate = fit.heartRate;
  if (fit.power !== undefined) record.power = fit.power;
  if (fit.temperature !== undefined) record.temperature = fit.temperature;

  // Cadence - combine fractional
  if (fit.cadence !== undefined) {
    record.cadence = fit.cadence + (fit.fractionalCadence ?? 0);
  }

  // Running dynamics
  if (fit.verticalOscillation !== undefined) {
    record.verticalOscillation = fit.verticalOscillation;
  }
  if (fit.stanceTime !== undefined) record.stanceTime = fit.stanceTime;
  if (fit.stepLength !== undefined) record.stepLength = fit.stepLength;

  return record;
};

/**
 * Maps KRD record fields to FIT RECORD fields.
 * Thin translation layer - no complex logic.
 */
export const mapKrdRecordToFit = (krd: KRDRecord): Partial<FitRecord> => {
  const fit: Partial<FitRecord> = {
    timestamp: Math.floor(new Date(krd.timestamp).getTime() / 1000),
  };

  // Position - convert degrees to semicircles
  if (krd.position) {
    fit.positionLat = degreesToSemicircles(krd.position.lat);
    fit.positionLong = degreesToSemicircles(krd.position.lon);
  }

  // Direct mappings
  if (krd.altitude !== undefined) fit.altitude = krd.altitude;
  if (krd.speed !== undefined) fit.speed = krd.speed;
  if (krd.distance !== undefined) fit.distance = krd.distance;
  if (krd.heartRate !== undefined) fit.heartRate = krd.heartRate;
  if (krd.cadence !== undefined) {
    fit.cadence = Math.floor(krd.cadence);
    const fractional = krd.cadence - Math.floor(krd.cadence);
    if (fractional > 0) {
      fit.fractionalCadence = fractional;
    }
  }
  if (krd.power !== undefined) fit.power = krd.power;
  if (krd.temperature !== undefined) fit.temperature = krd.temperature;

  // Running dynamics
  if (krd.verticalOscillation !== undefined) {
    fit.verticalOscillation = krd.verticalOscillation;
  }
  if (krd.stanceTime !== undefined) fit.stanceTime = krd.stanceTime;
  if (krd.stepLength !== undefined) fit.stepLength = krd.stepLength;

  return fit;
};
