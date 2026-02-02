import type { KRDRecord } from "../../../domain/schemas/krd/record";
import { fitRecordSchema, type FitRecord } from "../schemas/fit-record";
import { validateCoordinates } from "../shared/coordinate.converter";
import { mapFitRecordToKrd } from "./record.mapper";

/**
 * Converts a FIT RECORD message to KRD record format.
 *
 * @param data - Raw FIT RECORD message data
 * @returns KRD record object
 * @throws Error if FIT data is invalid or coordinates out of range
 */
export const convertFitToKrdRecord = (
  data: Record<string, unknown>
): KRDRecord => {
  const fitRecord = fitRecordSchema.parse(data) as FitRecord;

  // Validate coordinates if present - both must be present or neither
  const hasLat = fitRecord.positionLat !== undefined;
  const hasLon = fitRecord.positionLong !== undefined;

  if (hasLat !== hasLon) {
    throw new Error("Partial coordinates: both lat and lon must be present");
  }

  if (hasLat && hasLon) {
    if (!validateCoordinates(fitRecord.positionLat!, fitRecord.positionLong!)) {
      throw new Error("Invalid coordinates: out of range");
    }
  }

  return mapFitRecordToKrd(fitRecord);
};

/**
 * Batch converts FIT RECORD messages to KRD records.
 * Optimized for processing large numbers of records.
 *
 * @param records - Array of raw FIT RECORD message data
 * @returns Array of KRD record objects
 */
export const convertFitToKrdRecords = (
  records: Record<string, unknown>[]
): KRDRecord[] => {
  return records.map(convertFitToKrdRecord);
};
