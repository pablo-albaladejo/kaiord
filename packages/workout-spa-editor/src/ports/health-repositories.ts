/**
 * Named per-metric health repositories for the six KRD v2.0 health stores.
 * Each alias specialises the generic `HealthRecordRepository` to one metric's
 * KRD payload; the read/write surface is identical, only the payload differs.
 * `PersistencePort` intersects this type.
 *
 * `importedRecords` is intersected here too (rather than inline on
 * `PersistencePort`, which is line-capped): it's the natural-key upsert
 * port over those same six stores, used by `upsertImportedRecord`.
 */
import type { ImportedRecordRepository } from "../application/import/imported-record-repository.port";
import type {
  HealthBodyCompositionRecord,
  HealthDailyRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthStressRecord,
  HealthWeightRecord,
} from "../types/health/health-records";
import type { HealthRecordRepository } from "./health-record-repository";

export type HealthRepositories = {
  healthSleep: HealthRecordRepository<HealthSleepRecord>;
  healthWeight: HealthRecordRepository<HealthWeightRecord>;
  healthHrv: HealthRecordRepository<HealthHrvRecord>;
  healthDaily: HealthRecordRepository<HealthDailyRecord>;
  healthBodyComposition: HealthRecordRepository<HealthBodyCompositionRecord>;
  healthStress: HealthRecordRepository<HealthStressRecord>;
  importedRecords: ImportedRecordRepository;
};
