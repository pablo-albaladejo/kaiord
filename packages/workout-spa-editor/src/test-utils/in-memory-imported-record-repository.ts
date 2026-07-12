/**
 * In-memory ImportedRecordRepository — natural-key upsert over the SAME
 * per-metric health Maps the generic HealthRecordRepository reads, so
 * imported rows are visible through both ports. Mirrors the Dexie
 * adapter, where both repositories address the same physical table.
 */
import type { ManagedDataType } from "@kaiord/core";

import type {
  ImportedRecord,
  ImportedRecordRepository,
} from "../application/import/imported-record-repository.port";
import type { HealthRecord } from "../ports/health-record-repository";
import type {
  HealthBodyCompositionRecord,
  HealthDailyRecord,
  HealthHeartRateSeriesRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthStrainRecord,
  HealthStressRecord,
  HealthVitalsRecord,
  HealthWeightRecord,
} from "../types/health/health-records";

export type HealthMetricStores = {
  weight: Map<string, HealthWeightRecord>;
  sleep: Map<string, HealthSleepRecord>;
  hrv: Map<string, HealthHrvRecord>;
  "daily-wellness": Map<string, HealthDailyRecord>;
  "body-composition": Map<string, HealthBodyCompositionRecord>;
  stress: Map<string, HealthStressRecord>;
  // Read-only WHOOP-derived types (no manual-entry / FIT-import path yet),
  // so existing callers (e.g. in-memory-persistence.ts) aren't forced to
  // wire them; only WHOOP-sync tests exercise these.
  strain?: Map<string, HealthStrainRecord>;
  vitals?: Map<string, HealthVitalsRecord>;
  "heart-rate-series"?: Map<string, HealthHeartRateSeriesRecord>;
};

type Row = HealthRecord<Record<string, unknown>>;

const getStore = (
  stores: HealthMetricStores,
  dataType: ManagedDataType
): Map<string, Row> => {
  const store = (stores as unknown as Record<string, Map<string, Row>>)[
    dataType
  ];
  if (!store) {
    throw new Error(
      `ImportedRecordRepository: no health store for dataType '${dataType}'`
    );
  }
  return store;
};

export function createInMemoryImportedRecordRepository(
  stores: HealthMetricStores
): ImportedRecordRepository {
  return {
    findByNaturalKey: async ({
      profileId,
      dataType,
      sourceBridgeId,
      externalId,
    }): Promise<ImportedRecord | undefined> => {
      const row = [...getStore(stores, dataType).values()].find(
        (r) =>
          r.profileId === profileId &&
          r.sourceBridgeId === sourceBridgeId &&
          r.externalId === externalId
      );
      if (!row) return undefined;
      return {
        kaiordRecordId: row.id,
        profileId: row.profileId,
        sourceBridgeId: row.sourceBridgeId ?? "",
        externalId: row.externalId ?? "",
        payload: row.krd,
        measuredAt: row.measuredAt ?? "",
      };
    },
    insert: async ({ dataType, date, record }) => {
      getStore(stores, dataType).set(record.kaiordRecordId, {
        id: record.kaiordRecordId,
        profileId: record.profileId,
        date,
        sourceBridgeId: record.sourceBridgeId,
        externalId: record.externalId,
        measuredAt: record.measuredAt,
        krd: record.payload,
      });
    },
  };
}
