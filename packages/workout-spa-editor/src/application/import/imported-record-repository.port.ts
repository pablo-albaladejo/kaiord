/**
 * Port — ImportedRecordRepository
 *
 * Abstract contract for inbound health-record natural-key upsert.
 * Use cases depend only on this interface (R-AppDexieImport rule).
 */
import type { ManagedDataType } from "@kaiord/core";

export type ImportedRecord = {
  kaiordRecordId: string;
  profileId: string;
  sourceBridgeId: string;
  externalId: string;
  payload: Record<string, unknown>;
  measuredAt: string;
};

export type ImportedRecordRepository = {
  findByNaturalKey: (input: {
    profileId: string;
    dataType: ManagedDataType;
    sourceBridgeId: string;
    externalId: string;
  }) => Promise<ImportedRecord | undefined>;
  insert: (input: {
    dataType: ManagedDataType;
    date: string;
    record: ImportedRecord;
  }) => Promise<void>;
};
