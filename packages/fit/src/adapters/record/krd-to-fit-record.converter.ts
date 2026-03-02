import { krdRecordSchema, type KRDRecord } from "@kaiord/core";
import { mapKrdRecordToFit } from "./record.mapper";
import type { FitRecord } from "../schemas/fit-record";

/**
 * Converts a KRD record to FIT RECORD message format.
 *
 * @param data - KRD record object
 * @returns Partial FIT RECORD message data
 * @throws Error if KRD data is invalid
 */
export const convertKrdToFitRecord = (
  data: Record<string, unknown>
): Partial<FitRecord> => {
  const krdRecord = krdRecordSchema.parse(data) as KRDRecord;
  return mapKrdRecordToFit(krdRecord);
};

/**
 * Batch converts KRD records to FIT RECORD messages.
 * Optimized for processing large numbers of records.
 *
 * @param records - Array of KRD record objects
 * @returns Array of partial FIT RECORD message data
 */
export const convertKrdToFitRecords = (
  records: Record<string, unknown>[]
): Partial<FitRecord>[] => {
  return records.map(convertKrdToFitRecord);
};
