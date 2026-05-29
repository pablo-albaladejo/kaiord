/**
 * upsertImportedRecord — inbound natural-key upsert.
 *
 * Looks up an existing health row by [profileId+sourceBridgeId+externalId].
 * If found, returns the existing kaiordRecordId without a second write
 * (idempotent). If absent, generates a new kaiordRecordId and inserts via
 * the repository port.
 *
 * AC-7: two consecutive imports of the same (sourceBridgeId, externalId)
 * payload must produce exactly one row in the target store.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { ImportedRecordRepository } from "./imported-record-repository.port";

export type UpsertImportedRecordDeps = {
  recordRepo: ImportedRecordRepository;
};

export type UpsertImportedRecordInput = {
  profileId: string;
  dataType: ManagedDataType;
  sourceBridgeId: string;
  externalId: string;
  date: string;
  payload: Record<string, unknown>;
  measuredAt: string;
};

export type UpsertImportedRecordResult = {
  kaiordRecordId: string;
  created: boolean;
};

export const upsertImportedRecord = async (
  deps: UpsertImportedRecordDeps,
  input: UpsertImportedRecordInput
): Promise<UpsertImportedRecordResult> => {
  const existing = await deps.recordRepo.findByNaturalKey({
    profileId: input.profileId,
    dataType: input.dataType,
    sourceBridgeId: input.sourceBridgeId,
    externalId: input.externalId,
  });

  if (existing) {
    return { kaiordRecordId: existing.kaiordRecordId, created: false };
  }

  const kaiordRecordId = crypto.randomUUID();
  await deps.recordRepo.insert({
    dataType: input.dataType,
    date: input.date,
    record: {
      kaiordRecordId,
      profileId: input.profileId,
      sourceBridgeId: input.sourceBridgeId,
      externalId: input.externalId,
      payload: input.payload,
      measuredAt: input.measuredAt,
    },
  });

  return { kaiordRecordId, created: true };
};
