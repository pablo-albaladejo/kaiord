/**
 * Dexie implementation of ImportedRecordRepository.
 *
 * Uses the v17 health stores with the unique compound index
 * [profileId+sourceBridgeId+externalId] for natural-key dedup.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { ImportedRecordRepository } from "../../application/import/imported-record-repository.port";
import type { KaiordDatabase } from "./dexie-database";
import { HEALTH_STORE_FOR_TYPE } from "./health-store-for-type";

type HealthRow = {
  kaiordRecordId?: string;
  profileId: string;
  sourceBridgeId: string;
  externalId: string;
  measuredAt: string;
  krd: Record<string, unknown>;
};

const getStore = (dataType: ManagedDataType): string => {
  const name = HEALTH_STORE_FOR_TYPE[dataType];
  if (!name) {
    throw new Error(
      `ImportedRecordRepository: no health store for dataType '${dataType}'`
    );
  }
  return name;
};

export const createDexieImportedRecordRepository = (
  db: KaiordDatabase
): ImportedRecordRepository => ({
  findByNaturalKey: async ({
    profileId,
    dataType,
    sourceBridgeId,
    externalId,
  }) => {
    const storeName = getStore(dataType);
    const row = (await db
      .table(storeName)
      .where("[profileId+sourceBridgeId+externalId]")
      .equals([profileId, sourceBridgeId, externalId])
      .first()) as HealthRow | undefined;

    if (!row?.kaiordRecordId) return undefined;
    return {
      kaiordRecordId: row.kaiordRecordId,
      profileId: row.profileId,
      sourceBridgeId: row.sourceBridgeId,
      externalId: row.externalId,
      payload: row.krd,
      measuredAt: row.measuredAt,
    };
  },

  insert: async ({ dataType, date, record }) => {
    const storeName = getStore(dataType);
    await db.table(storeName).add({
      id: crypto.randomUUID(),
      kaiordRecordId: record.kaiordRecordId,
      profileId: record.profileId,
      date,
      sourceBridgeId: record.sourceBridgeId,
      externalId: record.externalId,
      measuredAt: record.measuredAt,
      krd: record.payload,
    });
  },
});
