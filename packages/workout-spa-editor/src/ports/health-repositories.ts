/**
 * Named per-metric health repositories for the six KRD v2.0 health stores.
 * Each alias specialises the generic `HealthRecordRepository` to one metric's
 * KRD payload; the read/write surface is identical, only the payload differs.
 * `PersistencePort` intersects this type.
 *
 * `importedRecords`, `activities`, and `dataTypeSourcePolicy` are
 * intersected here too (rather than inline on `PersistencePort`, which
 * is line-capped): the first is the natural-key upsert over those six
 * health stores; the second is the v27 Data Hub executed-activity
 * write port; the third is the F3.1 multi-source companion table
 * (today consumed only by health reads, hence hosted here — generic
 * over ManagedDataType, so it can move out if a non-health consumer
 * shows up).
 */
import type { DataTypeSourcePolicyRepository } from "../application/data-source-policy/data-type-source-policy-repository.port";
import type { ImportedRecordRepository } from "../application/import/imported-record-repository.port";
import type {
  HealthBodyCompositionRecord,
  HealthDailyRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthStressRecord,
  HealthWeightRecord,
} from "../types/health/health-records";
import type { ActivityRepository } from "./activity-repository";
import type { HealthRecordRepository } from "./health-record-repository";

export type HealthRepositories = {
  healthSleep: HealthRecordRepository<HealthSleepRecord>;
  healthWeight: HealthRecordRepository<HealthWeightRecord>;
  healthHrv: HealthRecordRepository<HealthHrvRecord>;
  healthDaily: HealthRecordRepository<HealthDailyRecord>;
  healthBodyComposition: HealthRecordRepository<HealthBodyCompositionRecord>;
  healthStress: HealthRecordRepository<HealthStressRecord>;
  importedRecords: ImportedRecordRepository;
  // v27 Data Hub executed-activity write port (hosted here for the same
  // line-cap reason as importedRecords).
  activities: ActivityRepository;
  dataTypeSourcePolicy: DataTypeSourcePolicyRepository;
};
